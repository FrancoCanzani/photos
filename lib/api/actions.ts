'use server';

import { s3Client } from '../s3';
import { ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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

async function uploadFile(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const response = await s3Client.send(
      new PutObjectCommand({
        Bucket: 'tests',
        Key: file.name,
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

export { listBuckets, uploadFile };
