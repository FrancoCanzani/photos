import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { s3Client } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ShareEvent from '@/components/events/share-event';
import MultiMediaUploadDialog from '@/components/multi-media-uploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '../data-table';
import { columns } from '../columns';

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
    <div className='container max-w-6xl py-6'>
      <header className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='font-medium text-2xl'>{event.name}</h2>
          <p className='text-muted-foreground hidden sm:block text-sm mt-1'>
            Manage the event moments
          </p>
        </div>
        <div className='flex items-center justify-center space-x-2'>
          <Button variant={'outline'} size={'sm'} asChild>
            <Link href={'/events'}>Events</Link>
          </Button>
          <Button variant={'outline'} size={'sm'}>
            Edit
          </Button>
          <ShareEvent eventId={eventId} links={links} />
          <MultiMediaUploadDialog eventId={eventId} />
        </div>
      </header>
      <Tabs defaultValue='tab-1' className='items-start'>
        <TabsList className='text-foreground h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1'>
          <TabsTrigger
            value='tab-1'
            className='hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none'
          >
            Moments
          </TabsTrigger>
          <TabsTrigger
            value='tab-2'
            className='hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none'
          >
            Table
          </TabsTrigger>
        </TabsList>
        <TabsContent value='tab-1' className='w-full'>
          {moments.length > 0 ? (
            <Gallery
              initialImages={initialImages}
              eventId={event.id}
              userId={user.id}
            />
          ) : (
            <div className='text-center flex items-center justify-center flex-1'>
              <p className='text-muted-foreground text-balance'>
                No moments yet. Create your first one to start sharing moments!
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value='tab-2' className='w-full'>
          <DataTable columns={columns} data={moments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
