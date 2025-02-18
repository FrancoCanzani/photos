'use server';

import { s3Client } from '../s3';
import {
  ListBucketsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { z } from 'zod';
import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { eventSchema } from '../schemas';

async function listBuckets() {
  try {
    const response = await s3Client.send(new ListBucketsCommand({}));
    console.log(response.Buckets);
  } catch (error) {
    console.error('Error listing buckets:', error);
  }
}

async function uploadFile(file: File, key: string) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const response = await s3Client.send(
      new PutObjectCommand({
        Bucket: 'tests',
        Key: key,
        Body: uint8Array,
        ContentType: file.type,
      })
    );

    return response;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

export type EventFormData = z.infer<typeof eventSchema>;

export async function createEvent(data: EventFormData) {
  try {
    const validatedData = eventSchema.parse(data);

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        user_id: user?.id,
        name: validatedData.name,
        date: validatedData.date.toISOString(),
        location: validatedData.location,
        notes: validatedData.notes || '',
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/events');
    return { success: true, data: event };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Something went wrong' };
  }
}

async function deleteMoment(key: string, momentId: number) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: 'tests',
      Key: key,
    });

    const s3Response = await s3Client.send(command);

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      return { error: 'User authentication failed' };
    }

    const { data: deletedMoment, error: dbError } = await supabase
      .from('moments')
      .delete()
      .eq('id', momentId)
      .eq('user_id', authData.user.id)
      .single();

    if (dbError) {
      return { error: dbError.message };
    }

    return { s3Response, deletedMoment };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export { listBuckets, uploadFile, deleteMoment };
