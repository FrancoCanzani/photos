'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { deleteFile } from '@/lib/api/actions';
import { GalleryImage } from '@/lib/types';

interface EventGalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  currentIndex: number | null;
  setCurrentIndex: (index: number) => void;
}

export default function EventGalleryDialog({
  isOpen,
  onClose,
  images,
  currentIndex,
  setCurrentIndex,
}: EventGalleryDialogProps) {
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  const navigateCarousel = (direction: 'prev' | 'next') => {
    if (currentIndex === null) return;

    setImageLoading(true);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < images.length) {
      setCurrentIndex(newIndex);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateCarousel('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateCarousel('next');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  async function downloadMoment(momentUrl: string, fileName: string) {
    try {
      const response = await fetch(momentUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'event-moment.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  const currentImage = currentIndex !== null ? images[currentIndex] : null;

  if (!currentImage) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby='photo gallery'
        className='max-w-7xl w-full h-[90vh] p-0'
      >
        <div className='relative w-full h-full flex items-center justify-center'>
          {imageLoading && <div className='absolute inset-0 animate-pulse' />}

          {currentImage.url && (
            <Image
              src={currentImage.url}
              alt={currentImage.name || 'Selected event moment'}
              fill
              sizes='90vw'
              className={`object-contain transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              priority
            />
          )}

          <button
            className='absolute left-3 top-1/2 rounded-sm -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 p-2'
            onClick={() => navigateCarousel('prev')}
            disabled={currentIndex === 0}
            aria-label='Previous image'
          >
            <ChevronLeft className='h-5 w-5' />
          </button>

          <button
            className='absolute right-3 rounded-sm top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 p-2'
            onClick={() => navigateCarousel('next')}
            disabled={currentIndex === images.length - 1}
            aria-label='Next image'
          >
            <ChevronRight className='h-5 w-5' />
          </button>

          <DialogTitle className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center space-x-4'>
            <span
              title={currentImage.name}
              className='text-white bg-black/30 p-1 rounded-sm text-xs truncate w-1/2'
            >
              {currentImage.name}
            </span>

            <div className='flex items-center justify-center space-x-2'>
              <button
                className='text-white bg-black/30 p-1 rounded-sm text-xs'
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentImage.url) {
                    downloadMoment(currentImage.url, currentImage.name);
                  }
                }}
                disabled={!currentImage.url}
              >
                Download
              </button>

              <button
                className='text-white bg-black/30 p-1 rounded-sm text-xs'
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentImage.url) {
                    deleteFile(currentImage.url, currentImage.id, 'tests');
                    onClose();
                  }
                }}
                disabled={!currentImage.url}
              >
                Delete
              </button>
            </div>
          </DialogTitle>
        </div>
      </DialogContent>
    </Dialog>
  );
}
