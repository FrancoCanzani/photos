import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  PartyPopper,
  Gift,
  Cake,
  GlassWaterIcon as Glass2,
  Building2,
  GraduationCap,
  Menu,
} from 'lucide-react';

import Footer from '@/components/footer';
import ImageSlider from '@/components/ui/image-slider';

export default function LandingPage() {
  const categories = [
    { name: 'Weddings', icon: PartyPopper },
    { name: 'Christmas', icon: Gift },
    { name: 'Birthdays', icon: Cake },
    { name: 'Bachelor parties', icon: Glass2 },
    { name: 'New Years', icon: PartyPopper },
    { name: 'Corporate events', icon: Building2 },
    { name: 'Graduations', icon: GraduationCap },
  ];

  const data = [
    { id: 1, image: '/landing1.png', height: 400 },
    { id: 2, image: '/landing2.png', height: 300 },
    { id: 3, image: '/landing3.png', height: 300 },
    { id: 4, image: '/landing4.png', height: 300 },
    { id: 5, image: '/landing5.png', height: 300 },
    { id: 6, image: '/landing6.png', height: 300 },
    { id: 7, image: '/landing7.png', height: 200 },
    { id: 8, image: '/landing8.png', height: 300 },
    { id: 9, image: '/landing9.png', height: 400 },
    { id: 10, image: '/landing10.png', height: 200 },
    { id: 11, image: '/landing11.png', height: 300 },
    { id: 12, image: '/landing12.png', height: 100 },
    { id: 13, image: '/landing13.png', height: 500 },
    { id: 14, image: '/landing14.png', height: 300 },
    { id: 15, image: '/landing15.png', height: 300 },
    { id: 16, image: '/landing16.png', height: 400 },
    { id: 17, image: '/landing17.png', height: 300 },
    { id: 18, image: '/landing18.png', height: 500 },
  ];

  return (
    <div className='min-h-screen flex flex-col'>
      <header className='fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <Link href='/' className='text-xl font-medium'>
            flock
          </Link>
          <nav className='hidden md:flex items-center space-x-6'>
            <Link
              href='#'
              className='text-sm font-medium hover:text-primary transition-colors'
            >
              Home
            </Link>
            <Link
              href='#'
              className='text-sm font-medium hover:text-primary transition-colors'
            >
              Features
            </Link>
            <Link
              href='#'
              className='text-sm font-medium hover:text-primary transition-colors'
            >
              Events
            </Link>
            <Link
              href='#'
              className='text-sm font-medium hover:text-primary transition-colors'
            >
              Pricing
            </Link>
            <Link
              href='#'
              className='text-sm font-medium hover:text-primary transition-colors'
            >
              FAQs
            </Link>
          </nav>
          <div className='flex items-center space-x-4'>
            <Link
              href='#'
              className='text-sm font-medium hover:text-primary transition-colors hidden sm:inline-block'
            >
              Sign in
            </Link>
            <Button>Sign up</Button>
            <Button variant='ghost' size='icon' className='md:hidden'>
              <Menu className='h-6 w-6' />
              <span className='sr-only'>Open menu</span>
            </Button>
          </div>
        </div>
      </header>
      <main className='flex-grow container mx-auto px-4 pt-32 pb-16'>
        <section className='text-center space-y-8'>
          <div className='flex justify-center border rounded-xl border-eerie items-center space-x-1 text-sm font-medium w-fit mx-auto px-2 py-1'>
            <span aria-hidden='true'>📸</span>
            <span aria-hidden='true'>🎉</span>
            <span aria-hidden='true'>→</span>
            <span aria-hidden='true'>🎁</span>
            <span aria-hidden='true'>💝</span>
            <span aria-hidden='true'>→</span>
            <span>Shared memories</span>
          </div>
          <h1 className='text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in'>
            Never miss a photo
          </h1>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up'>
            One gallery for all your special occasions. Transform your special
            moments into shared memories.
          </p>
          <div className='space-y-4 animate-fade-in-up'>
            <Button size='lg' className='text-lg'>
              Get started
            </Button>
          </div>
        </section>
        <section className='mt-16 space-y-8'>
          <div className='flex justify-between items-center overflow-x-auto pb-4 space-x-8'>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.name}
                  href='#'
                  className='flex flex-col items-center space-y-2 min-w-fit group'
                >
                  <div className='p-3 rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <span className='text-sm font-medium group-hover:text-primary transition-colors'>
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
          <ImageSlider data={data} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
