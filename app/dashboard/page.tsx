import { MultiMediaUploader } from '@/components/multi-media-uploader';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-4'>Multiple Image Uploader</h1>
      <MultiMediaUploader />
      <div className='mt-4'></div>
    </div>
  );
}
