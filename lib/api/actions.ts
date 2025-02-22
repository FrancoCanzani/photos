'use server';

import { S3ServiceException } from '@aws-sdk/client-s3';
import {
  ListBucketsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { z } from 'zod';
import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { eventSchema } from '../schemas';
import { s3Client } from '../s3';

type ServiceError = {
  message: string;
  code?: string;
  status?: number;
};

type ServiceResponse<T> = {
  data?: T;
  error?: ServiceError;
};

export async function listBuckets(): Promise<ServiceResponse<string[]>> {
  try {
    const response = await s3Client.send(new ListBucketsCommand({}));
    return {
      data: response.Buckets?.map((bucket) => bucket.Name ?? '') ?? [],
    };
  } catch (error) {
    const serviceError = error as S3ServiceException;
    return {
      error: {
        message: 'Failed to list buckets',
        code: serviceError.name,
        status: serviceError.$metadata?.httpStatusCode,
      },
    };
  }
}

export async function uploadFile(
  file: File,
  key: string
): Promise<ServiceResponse<PutObjectCommandOutput>> {
  if (!file || !key) {
    return {
      error: {
        message: 'File and key are required',
        code: 'INVALID_PARAMETERS',
      },
    };
  }

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

    revalidatePath('/events/[id]', 'page');
    return { data: response };
  } catch (error) {
    const serviceError = error as S3ServiceException;
    return {
      error: {
        message: 'Failed to upload file',
        code: serviceError.name,
        status: serviceError.$metadata?.httpStatusCode,
      },
    };
  }
}

export type EventFormData = z.infer<typeof eventSchema>;

export async function createEvent(
  data: EventFormData
): Promise<ServiceResponse<any>> {
  if (!data) {
    return {
      error: {
        message: 'Event data is required',
        code: 'INVALID_PARAMETERS',
      },
    };
  }

  try {
    const validatedData = eventSchema.parse(data);
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: {
          message: 'Authentication failed',
          code: 'AUTH_ERROR',
        },
      };
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        date: validatedData.date.toISOString(),
        location: validatedData.location,
        notes: validatedData.notes || '',
      })
      .select()
      .single();

    if (error) {
      return {
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    revalidatePath('/events');
    return { data: event };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: {
          message: error.errors[0].message,
          code: 'VALIDATION_ERROR',
        },
      };
    }
    return {
      error: {
        message: 'Failed to create event',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

export async function deleteEvent(
  eventId: number
): Promise<ServiceResponse<void>> {
  if (!eventId) {
    return {
      error: {
        message: 'Event ID is required',
        code: 'INVALID_PARAMETERS',
      },
    };
  }

  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: {
          message: 'Authentication failed',
          code: 'AUTH_ERROR',
        },
      };
    }

    const { data: moments, error: momentsError } = await supabase
      .from('moments')
      .select()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (momentsError) {
      return {
        error: {
          message: 'Failed to fetch event moments',
          code: momentsError.code,
        },
      };
    }

    for (const moment of moments ?? []) {
      await deleteMoment(moment.key, moment.id);
    }

    const { error: eventError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id);

    if (eventError) {
      return {
        error: {
          message: 'Failed to delete event',
          code: eventError.code,
        },
      };
    }

    return { data: undefined };
  } catch (error) {
    return {
      error: {
        message: 'Failed to delete event',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

export async function deleteMoment(
  key: string,
  momentId: number
): Promise<ServiceResponse<{ s3Response: any; deletedMoment: any }>> {
  if (!key || !momentId) {
    return {
      error: {
        message: 'Key and moment ID are required',
        code: 'INVALID_PARAMETERS',
      },
    };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: 'tests',
      Key: key,
    });

    const s3Response = await s3Client.send(command);
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      return {
        error: {
          message: 'Authentication failed',
          code: 'AUTH_ERROR',
        },
      };
    }

    const { data: deletedMoment, error: dbError } = await supabase
      .from('moments')
      .delete()
      .eq('id', momentId)
      .eq('user_id', authData.user.id)
      .single();

    if (dbError) {
      return {
        error: {
          message: dbError.message,
          code: dbError.code,
        },
      };
    }

    return { data: { s3Response, deletedMoment } };
  } catch (error) {
    const serviceError = error as S3ServiceException;
    return {
      error: {
        message: 'Failed to delete moment',
        code: serviceError.name,
        status: serviceError.$metadata?.httpStatusCode,
      },
    };
  }
}
