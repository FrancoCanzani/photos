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
  key: string,
  bucket: string
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
        Bucket: bucket,
        Key: key,
        Body: uint8Array,
        ContentType: file.type,
      })
    );

    console.log(response);

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

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        date: validatedData.date.toISOString(),
        location: validatedData.location,
        description: validatedData.description || '',
        cover_image_key: validatedData.cover || '',
      })
      .select()
      .single();

    if (eventError) {
      return {
        error: {
          message: eventError.message,
          code: eventError.code,
        },
      };
    }

    if (validatedData.cohosts && validatedData.cohosts.length > 0) {
      const cohostRecords = validatedData.cohosts.map((cohost) => ({
        event_id: event.id,
        email: cohost.email,
        access_level: cohost.accessLevel,
      }));

      const { error: cohostsError } = await supabase
        .from('cohosts')
        .insert(cohostRecords);

      if (cohostsError) {
        console.error('Failed to add co-hosts:', cohostsError);
      }
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

    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('cover_image_key')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      return {
        error: {
          message: 'Failed to fetch event data',
          code: fetchError.code,
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
      await deleteFile(moment.key, moment.id, 'tests');
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

    if (eventData?.cover_image_key) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: 'cover-images',
          Key: eventData.cover_image_key,
        });

        await s3Client.send(command);
      } catch (s3Error) {
        console.error('Failed to delete cover image:', s3Error);
      }
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

export async function deleteFile(
  key: string,
  momentId: number,
  bucket: string
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
      Bucket: bucket,
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

export async function updateEvent(
  eventId: number,
  data: EventFormData
): Promise<ServiceResponse<any>> {
  if (!eventId || !data) {
    return {
      error: {
        message: 'Event ID and data are required',
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

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({
        name: validatedData.name,
        date: validatedData.date.toISOString(),
        location: validatedData.location,
        notes: validatedData.description || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .eq('user_id', user.id)
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
    revalidatePath(`/events/${eventId}`);

    return { data: updatedEvent };
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
        message: 'Failed to update event',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}
