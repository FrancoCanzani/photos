import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { columns } from '@/app/events/columns';
import { DataTable } from '@/app/events/data-table';

export default async function MomentsTable({ eventId }: { eventId: number }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/sign-in');

  const { data: moments, error } = await supabase
    .from('moments')
    .select()
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching moments:', error);
    return <div className='text-gray-500'>Error loading moments.</div>;
  }

  if (!moments || moments.length === 0) {
    return <div className='text-gray-500'>No moments found.</div>;
  }

  return (
    <div className='w-full'>
      <DataTable columns={columns} data={moments} />
    </div>
  );
}
