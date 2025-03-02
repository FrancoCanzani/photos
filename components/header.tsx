import Link from 'next/link';

export default function Header() {
  return (
    <header className='flex items-center justify-between'>
      <h1 className='font-semibold text-3xl'>EventVault</h1>

      <div className='flex items-center justify-end space-x-3 text-sm font-medium'>
        <Link href={'/events'} className='hover:underline'>
          Events
        </Link>
        <Link href={'/events/new'} className='hover:underline'>
          New Event
        </Link>
        <Link href={'/events/new'} className='hover:underline'>
          Settings
        </Link>
      </div>
    </header>
  );
}
