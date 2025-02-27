import Link from 'next/link';

export default function Header() {
  return (
    <header className='flex pt-4 items-center justify-between'>
      <h1 className='font-semibold text-3xl'>EventVault</h1>

      <div className='flex items-center justify-end space-x-2'>
        <Link href={'/events'}>Events</Link>
        <Link href={'/events/new'}>New Event</Link>
      </div>
    </header>
  );
}
