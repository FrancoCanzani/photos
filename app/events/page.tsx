import { EventCreatorModal } from '@/components/events/event-creator-dialog';
import { EventCard } from '@/components/events/event-card';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const { data: events, error } = await supabase
    .from('events')
    .select()
    .eq('user_id', user?.id)
    .order('date', { ascending: true });

  return (
    <div className='container flex-1 max-w-6xl py-6 h-full flex flex-col'>
      <header className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='font-medium text-2xl'>Events</h2>
          <p className='text-muted-foreground text-sm mt-1'>
            Manage and track your upcoming events
          </p>
        </div>
        <EventCreatorModal />
      </header>
      {events?.length === 0 ? (
        <div className='text-center flex items-center justify-center flex-1'>
          <p className='text-muted-foreground text-balance'>
            No events yet. Create your first one to start sharing moments!
          </p>
        </div>
      ) : (
        <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {events?.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
