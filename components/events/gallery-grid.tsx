'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Circle, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GalleryImage } from '@/lib/types';

interface GalleryGridProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
  selectedImages: Set<number>;
  onImageSelection: (imageId: number) => void;
}

export default function GalleryGrid({
  images,
  onImageClick,
  selectedImages,
  onImageSelection,
}: GalleryGridProps) {
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<number, boolean>
  >({});

  const handleImageLoad = (imageId: number) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: true,
    }));
  };

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1'>
      {images.map(
        (image, index) =>
          image.url && (
            <div
              key={image.id}
              className='relative group aspect-[4/3] overflow-hidden cursor-pointer'
              onClick={() => onImageClick(index)}
            >
              <Image
                src={image.url}
                alt={image.name || 'Event moment'}
                fill
                sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                className={cn(
                  'object-cover transition-transform duration-300 hover:scale-105',
                  imageLoadingStates[image.id] ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => handleImageLoad(image.id)}
              />
              <button
                className={cn(
                  'absolute left-2 top-2 rounded-full text-white bg-black/50 hover:bg-black/70',
                  selectedImages.has(image.id) || 'group-hover:block',
                  selectedImages.has(image.id) ? 'block' : 'hidden'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onImageSelection(image.id);
                }}
                aria-label={
                  selectedImages.has(image.id)
                    ? 'Deselect image'
                    : 'Select image'
                }
              >
                {selectedImages.has(image.id) ? (
                  <CircleCheck className='h-5 w-5' />
                ) : (
                  <Circle className='h-5 w-5' />
                )}
              </button>
            </div>
          )
      )}
    </div>
  );
}
