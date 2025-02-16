'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { createClient } from '@/lib/supabase/client';
import { useQueryState } from 'nuqs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string | null;
}

interface GalleryProps {
  initialImages: GalleryImage[];
  eventId: string;
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
        url: await getPresignedUrl(moment.key),
      }))
    );

    setImages((prevImages) => [...prevImages, ...newImages]);
    setHasMore(newImages.length === 20);
    setLoading(false);
  }, [images, loading, hasMore, eventId, userId, supabase]);

  useEffect(() => {
    if (inView) {
      loadMoreImages();
    }
  }, [inView, loadMoreImages]);

  const openCarousel = (index: number) => {
    setSelectedImageIndex(index.toString());
  };

  const closeCarousel = () => {
    setSelectedImageIndex(null);
  };

  const navigateCarousel = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    const currentIndex = Number.parseInt(selectedImageIndex);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < images.length) {
      setSelectedImageIndex(newIndex.toString());
    }
  };

  return (
    <>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {images.map((image, index) =>
          image.url ? (
            <div
              key={image.id}
              className='relative aspect-square overflow-hidden rounded-md cursor-pointer'
              onClick={() => openCarousel(index)}
            >
              <Image
                src={image.url || '/placeholder.svg'}
                alt='Event moment'
                fill
                sizes='(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
                className='object-cover transition-transform duration-300 hover:scale-110'
              />
            </div>
          ) : null
        )}
      </div>
      {loading && (
        <div className='text-center mt-4'>Loading more images...</div>
      )}
      <div ref={ref} className='h-10 mt-4' />

      <Dialog open={selectedImageIndex !== null} onOpenChange={closeCarousel}>
        <DialogContent className='max-w-4xl w-full h-[80vh] p-0'>
          {selectedImageIndex !== null && (
            <div className='relative w-full h-full flex items-center justify-center'>
              <Image
                src={images[Number.parseInt(selectedImageIndex)].url || ''}
                alt='Selected event moment'
                fill
                sizes='80vw'
                className='object-contain'
              />
              <Button
                variant='ghost'
                size='icon'
                className='absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70'
                onClick={() => navigateCarousel('prev')}
                disabled={Number.parseInt(selectedImageIndex) === 0}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70'
                onClick={() => navigateCarousel('next')}
                disabled={
                  Number.parseInt(selectedImageIndex) === images.length - 1
                }
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
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
