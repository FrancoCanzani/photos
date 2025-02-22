'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface ImageData {
  id: number;
  image: string;
  height: number;
}

interface CarouselProps {
  data: ImageData[];
  slideInterval?: number;
  transitionDuration?: number;
}

export default function AutoSlidingCarousel({
  data,
  slideInterval = 3000,
  transitionDuration = 500,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [transitioning, setTransitioning] = useState<boolean>(false);

  function slideToNext(): void {
    setTransitioning(true);
    setCurrentIndex((prevIndex: number) => (prevIndex + 1) % data.length);
  }

  useEffect(() => {
    const timer: NodeJS.Timeout = setInterval(slideToNext, slideInterval);
    return () => clearInterval(timer);
  }, [slideInterval]);

  useEffect(() => {
    if (transitioning) {
      const timer: NodeJS.Timeout = setTimeout(() => {
        setTransitioning(false);
      }, transitionDuration);
      return () => clearTimeout(timer);
    }
  }, [transitioning, transitionDuration]);

  return (
    <div className='w-full max-w-6xl mx-auto overflow-hidden relative'>
      <div className='flex flex-nowrap relative'>
        <div
          className='min-w-full transition-transform duration-500 ease-in-out'
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          <div className='flex gap-4'>
            {data.map((item: ImageData, index: number) => (
              <div
                key={item.id}
                className='relative shrink-0'
                style={{
                  width: '300px',
                  height: '200px',
                }}
              >
                <Image
                  src={item.image}
                  alt={`Slide ${index + 1}`}
                  fill
                  className='object-cover rounded-lg'
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
          <div className='pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent' />
          <div className='pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent' />
        </div>
      </div>
    </div>
  );
}
