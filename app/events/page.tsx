import { EventCreatorModal } from '@/components/event-creator-dialog';
import { createClient } from '@/utils/supabase/server';

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events, error } = await supabase
    .from('events')
    .select()
    .eq('user_id', user?.id);

  console.log(events);

  return (
    <div>
      <EventCreatorModal />
      <ul>{events?.map((event) => <li key={event.id}>{event.name}</li>)}</ul>
    </div>
  );
}
