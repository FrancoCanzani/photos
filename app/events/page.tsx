import { EventCreatorModal } from '@/components/event-creator-dialog';
import { EventCard } from '@/components/event-card';
import { createClient } from '@/lib/supabase/server';

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events, error } = await supabase
    .from('events')
    .select()
    .eq('user_id', user?.id)
    .order('date', { ascending: true });

  return (
    <div className='container max-w-6xl py-6'>
      <header className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='font-semibold text-2xl'>Events</h2>
          <p className='text-muted-foreground mt-1'>
            Manage and track your upcoming events
          </p>
        </div>
        <EventCreatorModal />
      </header>

      {events?.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>
            No events yet. Create your first one!
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
