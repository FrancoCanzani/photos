'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { useQueryState } from 'nuqs';
import { createClient } from '@/lib/supabase/client';
import { GalleryImage } from '@/lib/types';
import GalleryGrid from './gallery-grid';
import EventGalleryDialog from './gallery-image-dialog';

interface EventGalleryProps {
  initialImages: GalleryImage[];
  eventId: number;
  userId: string;
}

export default function EventGallery({
  initialImages,
  eventId,
  userId,
}: EventGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [selectedImageIndex, setSelectedImageIndex] = useQueryState('image');
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());

  const { ref, inView } = useInView();
  const supabase = createClient();

  console.log(initialImages);

  const loadMoreImages = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
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
        console.error('Error loading more images:', error);
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

      setImages((prevImages) => [...prevImages, ...newImages]);
      setHasMore(newImages.length === 20);
    } catch (error) {
      console.error('Failed to load more images:', error);
    } finally {
      setLoading(false);
    }
  }, [images, loading, hasMore, eventId, userId, supabase]);

  useEffect(() => {
    if (inView && selectedImageIndex === null) {
      loadMoreImages();
    }
  }, [inView, loadMoreImages, selectedImageIndex]);

  const openCarousel = (index: number) => {
    setSelectedImageIndex(index.toString());
  };

  const closeCarousel = () => {
    setSelectedImageIndex(null);
  };

  const handleImageSelection = (imageId: number) => {
    setSelectedImages((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId);
      } else {
        newSelection.add(imageId);
      }
      return newSelection;
    });
  };

  const currentImageIndex = selectedImageIndex
    ? parseInt(selectedImageIndex, 10)
    : null;

  if (initialImages.length === 0) {
    return (
      <div className='text-center text-sm flex items-center justify-center flex-1 h-full'>
        <p className='text-muted-foreground text-balance'>
          Nothing to show yet. Upload your first image to start sharing moments!
        </p>
      </div>
    );
  }

  return (
    <>
      <GalleryGrid
        images={images}
        onImageClick={openCarousel}
        selectedImages={selectedImages}
        onImageSelection={handleImageSelection}
      />

      {loading && (
        <div className='py-12 w-full flex items-center justify-center text-sm text-muted-foreground'>
          <span>Loading more images...</span>
        </div>
      )}

      {initialImages.length === 0 ||
        (hasMore && <div ref={ref} className='h-10 mt-4' />)}

      <EventGalleryDialog
        isOpen={currentImageIndex !== null}
        onClose={closeCarousel}
        images={images}
        currentIndex={currentImageIndex}
        setCurrentIndex={(index) => setSelectedImageIndex(index.toString())}
      />
    </>
  );
}

async function getPresignedUrl(key: string): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/presigned-url?key=${encodeURIComponent(key)}`
    );
    if (!response.ok) {
      throw new Error(`Error fetching presigned URL: ${response.statusText}`);
    }
    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error fetching presigned URL:', error);
    return null;
  }
}
