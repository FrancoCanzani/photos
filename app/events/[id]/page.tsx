import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { s3Client } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dynamic from 'next/dynamic';
import ShareEvent from '@/components/events/share-event';
import MultiMediaUploadDialog from '@/components/multi-media-uploader';
import { EventEditorDialog } from '@/components/events/event-editor-dialog';

const Gallery = dynamic(
  () => import('../../../components/events/event-gallery')
);

async function getPresignedUrl(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: 'tests',
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1-hour expiry
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return null;
  }
}

export default async function EventGalleryPage({
  params,
}: {
  params: { id: string };
}) {
  const eventId = (await params).id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/sign-in');

  const { data: event } = await supabase
    .from('events')
    .select()
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single();

  const { data: links } = await supabase
    .from('links')
    .select()
    .eq('event_id', eventId);

  if (!event) return <div className='text-gray-500'>Event not found.</div>;

  const { data: moments, error } = await supabase
    .from('moments')
    .select()
    .eq('event_id', event.id)
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching images:', error);
    return <div className='text-gray-500'>Error loading images.</div>;
  }

  const initialImages = await Promise.all(
    (moments || []).map(async (moment) => ({
      id: moment.id,
      key: moment.key,
      url: await getPresignedUrl(moment.key),
      name: moment.name,
    }))
  );

  return (
    <div className='max-w-6xl py-6'>
      <header className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='font-medium text-2xl'>{event.name}</h2>
          <p className='text-muted-foreground hidden sm:block text-sm mt-1'>
            Manage the event moments
          </p>
        </div>
        <div className='flex items-center font-medium text-sm justify-center space-x-4'>
          <EventEditorDialog event={event} />
          <ShareEvent eventId={eventId} links={links} />
          <MultiMediaUploadDialog eventId={eventId} />
        </div>
      </header>

      <Gallery
        initialImages={initialImages}
        eventId={event.id}
        userId={user.id}
      />
    </div>
  );
}
