import { EventCreatorModal } from '@/components/event-creator-dialog';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events, error } = await supabase
    .from('events')
    .select()
    .eq('user_id', user?.id);

  return (
    <div>
      <EventCreatorModal />
      <ul>
        {events?.map((event) => (
          <li key={event.id}>
            <Link href={`/events/${event.id}`}>{event.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
