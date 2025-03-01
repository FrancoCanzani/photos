import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ShareEvent from '@/components/events/share-event';
import MultiMediaUploadDialog from '@/components/multi-media-uploader';
import { EventEditorDialog } from '@/components/events/event-editor-dialog';
import EventGallery from '@/components/events/event-gallery';
import Link from 'next/link';
import { getPresignedUrl } from '@/lib/helpers';
import Image from 'next/image';

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

  if (!event) return <div className='text-gray-500'>Event not found.</div>;

  const { data: links } = await supabase
    .from('links')
    .select()
    .eq('event_id', eventId);

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
      url: await getPresignedUrl(moment.key, 'tests'),
      name: moment.name,
    }))
  );

  let coverImageUrl = null;
  if (event.cover_image_key) {
    try {
      coverImageUrl = await getPresignedUrl(
        event.cover_image_key,
        'cover-images'
      );
    } catch (error) {
      console.error('Error getting cover image URL:', error);
    }
  }

  return (
    <div className='max-w-6xl h-full flex-1 py-6'>
      {coverImageUrl && (
        <div className='mb-8 w-full h-64 relative rounded-lg overflow-hidden'>
          <Image
            src={coverImageUrl}
            alt={`Cover image for ${event.name}`}
            fill
            className='object-cover'
            priority
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent'></div>
          <div className='absolute bottom-0 left-0 p-6 text-white'>
            <h1 className='text-3xl font-bold'>{event.name}</h1>
            <p className='text-sm opacity-90 mt-1'>{event.location}</p>
          </div>
        </div>
      )}

      <div className='flex items-center justify-between mb-8'>
        <div>
          {!coverImageUrl && (
            <h2 className='font-medium text-xl'>{event.name}</h2>
          )}
          <p className='text-muted-foreground hidden sm:block text-sm mt-1'>
            Manage the event moments
          </p>
        </div>
        <div className='flex items-center font-medium text-sm justify-center space-x-4'>
          <EventEditorDialog event={event} />
          <Link href={`/events/${eventId}/share`}>Share</Link>
          <ShareEvent eventId={eventId} links={links} />
          <MultiMediaUploadDialog eventId={eventId} />
        </div>
      </div>

      <EventGallery
        initialImages={initialImages}
        eventId={event.id}
        userId={user.id}
      />
    </div>
  );
}
