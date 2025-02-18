'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { createClient } from '@/lib/supabase/client';
import { useQueryState } from 'nuqs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteMoment } from '@/lib/api/actions';

interface GalleryImage {
  id: number;
  url: string | null;
  key: string;
  name: string;
}

interface GalleryProps {
  initialImages: GalleryImage[];
  eventId: number;
  userId: string;
}

export default function EventGallery({
  initialImages,
  eventId,
  userId,
}: GalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useQueryState('image');
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [carouselImageLoading, setCarouselImageLoading] = useState(false);

  const { ref, inView } = useInView();

  const supabase = createClient();

  const loadMoreImages = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const lastImageId = images[images.length - 1]?.id;

    const { data: newMoments, error } = await supabase
      .from('moments')
      .select()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .lt('id', lastImageId)
      .order('uploaded_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching more images:', error);
      setLoading(false);
      return;
    }

    const newImages = await Promise.all(
      newMoments.map(async (moment) => ({
        id: moment.id,
        name: moment.name,
        key: moment.key,
        url: await getPresignedUrl(moment.key),
      }))
    );

    console.log(newImages);

    setImages((prevImages) => [...prevImages, ...newImages]);
    setHasMore(newImages.length === 20);
    setLoading(false);
  }, [images, loading, hasMore, eventId, userId, supabase]);

  useEffect(() => {
    if (inView && selectedImageIndex === null) {
      loadMoreImages();
    }
  }, [inView, loadMoreImages, selectedImageIndex]);

  const openCarousel = (index: number) => {
    setSelectedImageIndex(index.toString());
    setCarouselImageLoading(true);
  };

  const closeCarousel = () => {
    setSelectedImageIndex(null);
    setCarouselImageLoading(false);
  };

  const navigateCarousel = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    setCarouselImageLoading(true);
    const currentIndex = Number.parseInt(selectedImageIndex);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < images.length) {
      setSelectedImageIndex(newIndex.toString());
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateCarousel('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateCarousel('next');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeCarousel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

  const handleImageLoad = (imageId: number) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageId]: true,
    }));
  };

  const handleCarouselImageLoad = () => {
    setCarouselImageLoading(false);
  };

  async function downloadMoment(momentUrl: string, fileName: string) {
    try {
      const response = await fetch(momentUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  return (
    <>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
        {images.map((image, index) =>
          image.url ? (
            <div
              key={image.id}
              className='relative group aspect-[4/3] overflow-hidden cursor-pointer'
              onClick={() => openCarousel(index)}
            >
              {!imageLoadingStates[image.id] && (
                <div className='absolute inset-0 bg-gray-200 animate-pulse' />
              )}
              <Image
                src={image.url || '/placeholder.svg'}
                alt='Event moment'
                fill
                sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                className={`object-cover transition-transform duration-300 hover:scale-105 ${
                  !imageLoadingStates[image.id] ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => handleImageLoad(image.id)}
              />
            </div>
          ) : null
        )}
      </div>
      {loading && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='aspect-[4/3]' />
          ))}
        </div>
      )}
      <div ref={ref} className='h-10 mt-4' />

      <Dialog open={selectedImageIndex !== null} onOpenChange={closeCarousel}>
        <DialogContent
          aria-describedby='photo gallery'
          className='max-w-7xl w-full h-[90vh] p-0'
        >
          {selectedImageIndex !== null && (
            <div className='relative w-full h-full flex items-center justify-center'>
              {carouselImageLoading && (
                <div className='absolute inset-0 animate-pulse' />
              )}
              <Image
                src={images[Number.parseInt(selectedImageIndex)].url || ''}
                alt='Selected event moment'
                fill
                sizes='90vw'
                className={`object-contain transition-opacity duration-300 ${
                  carouselImageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={handleCarouselImageLoad}
                priority
              />
              <button
                className='absolute left-3 top-1/2 rounded-sm -translate-y-1/2 text-white bg-black/50 hover:bg-black/70'
                onClick={() => navigateCarousel('prev')}
                disabled={Number.parseInt(selectedImageIndex) === 0}
                aria-label='Previous image'
              >
                <ChevronLeft className='h-5 w-5' />
              </button>
              <button
                className='absolute right-3 rounded-sm top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70'
                onClick={() => navigateCarousel('next')}
                disabled={
                  Number.parseInt(selectedImageIndex) === images.length - 1
                }
                aria-label='Next image'
              >
                <ChevronRight className='h-5 w-5' />
              </button>
              <DialogTitle className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center space-x-4'>
                <span className='text-white bg-black/30 p-1 rounded-sm text-xs'>
                  {images[Number.parseInt(selectedImageIndex)].name}
                </span>
                <div className='flex items-center justify-center space-x-2'>
                  <button
                    className='text-white bg-black/30 p-1 rounded-sm text-xs'
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!images[Number.parseInt(selectedImageIndex)].url)
                        return;
                      downloadMoment(
                        images[Number.parseInt(selectedImageIndex)].url,
                        images[Number.parseInt(selectedImageIndex)].name
                      );
                    }}
                  >
                    Download
                  </button>
                  <button
                    className='text-white bg-black/30 p-1 rounded-sm text-xs'
                    onClick={(e) => {
                      e.stopPropagation();
                      if (images[Number.parseInt(selectedImageIndex)].url) {
                        deleteMoment(
                          images[Number.parseInt(selectedImageIndex)].url,
                          images[Number.parseInt(selectedImageIndex)].id
                        );
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </DialogTitle>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

async function getPresignedUrl(key: string) {
  const response = await fetch(
    `/api/presigned-url?key=${encodeURIComponent(key)}`
  );
  if (!response.ok) {
    console.error('Error fetching presigned URL');
    return null;
  }
  const { url } = await response.json();
  return url;
}
