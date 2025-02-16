import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { s3Client } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ShareEvent from '@/components/events/share-event';

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

  if (!event) return <div className='text-gray-500'>Event not found.</div>;

  const { data: moments, error } = await supabase
    .from('moments')
    .select()
    .eq('event_id', event.id)
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })
    .limit(20);

  console.log(moments);

  if (error) {
    console.error('Error fetching images:', error);
    return <div className='text-gray-500'>Error loading images.</div>;
  }

  const initialImages = await Promise.all(
    (moments || []).map(async (moment) => ({
      id: moment.id,
      url: await getPresignedUrl(moment.key),
      name: moment.name,
    }))
  );

  return (
    <div className='container max-w-6xl py-6'>
      <header className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='font-medium text-2xl'>{event.name}</h2>
          <p className='text-muted-foreground hidden md:block text-sm mt-1'>
            Manage the event moments
          </p>
        </div>
        <div className='flex items-center justify-center space-x-2'>
          <Button variant={'outline'} size={'xs'} asChild>
            <Link href={'/events'}>Events</Link>
          </Button>
          <Button variant={'outline'} size={'xs'}>
            Edit
          </Button>
          <ShareEvent eventId={eventId} userId={user.id} />
        </div>
      </header>
      {moments.length > 0 ? (
        <Gallery
          initialImages={initialImages}
          eventId={event.id}
          userId={user.id}
        />
      ) : (
        <div>No moments to show</div>
      )}
    </div>
  );
}
