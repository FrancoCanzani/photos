import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ShareEvent from '@/components/events/share-event-blank';

export default async function ShareEventPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const eventId = (await params).id;

  console.log(eventId);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/sign-in');

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    redirect('/events');
  }

  //   // Check if user has access to this event
  //   const { data: membership, error: membershipError } = await supabase
  //     .from('event_members')
  //     .select('role')
  //     .eq('event_id', eventId)
  //     .eq('user_id', user.id)
  //     .single();

  //   if (membershipError || !membership) {
  //     redirect('/events');
  //   }

  // Fetch existing links
  const { data: links, error: linksError } = await supabase
    .from('links')
    .select('*')
    .eq('event_id', eventId);

  if (linksError) {
    console.error(linksError);
  }

  return (
    <div className='py-6'>
      <h1 className='text-xl font-medium mb-6'>Share Event: {event.name}</h1>
      <ShareEvent
        eventId={eventId}
        links={links || []}
        eventName={event.name}
      />
    </div>
  );
}
