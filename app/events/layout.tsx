import Header from '@/components/header';

export default function EventsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='w-full flex-1 max-w-6xl mx-auto flex flex-col'>
      <Header />
      <div className='flex-1 flex flex-col'>{children}</div>
    </div>
  );
}
