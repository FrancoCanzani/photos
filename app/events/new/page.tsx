'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { createEvent, uploadFile, type EventFormData } from '@/lib/api/actions';
import { LocationInput } from '@/components/location-input';
import Image from 'next/image';
import { ImageIcon, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: new Date(),
    location: '',
    description: '',
    cover: undefined,
  });

  const [coverImage, setCoverImage] = useState<{
    file: File | null;
    preview: string | null;
  }>({
    file: null,
    preview: null,
  });

  useEffect(() => {
    return () => {
      if (coverImage.preview) {
        URL.revokeObjectURL(coverImage.preview);
      }
    };
  }, [coverImage.preview]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date }));
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const fileKey = `${file.name}-${self.crypto.randomUUID()}`;

    setCoverImage({
      file,
      preview: previewUrl,
    });

    setFormData((prev) => ({
      ...prev,
      cover: fileKey,
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleRemoveImage = () => {
    if (coverImage.preview) {
      URL.revokeObjectURL(coverImage.preview);
    }
    setCoverImage({ file: null, preview: null });
    setFormData((prev) => ({ ...prev, cover: undefined }));
  };

  const handleCreateEvent = async () => {
    if (!formData.name) {
      toast.error('Event name is required');
      return;
    }

    if (!formData.location) {
      toast.error('Location is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (coverImage.file && formData.cover) {
        const fileUploadResult = await uploadFile(
          coverImage.file,
          formData.cover,
          'cover-images'
        );

        if (fileUploadResult.error) {
          toast.error('Error saving event cover. Try again later!');
          setIsSubmitting(false);
          return;
        }
      }

      const result = await createEvent(formData);

      if (result.error) {
        toast.error('Error creating event. Try again later!');
        setIsSubmitting(false);
        return;
      }

      toast.success('Event created successfully!');
      router.push(`/events/${result.data.id}`);
    } catch (error) {
      toast.error('Failed to create event. Try again later!');
      setIsSubmitting(false);
    }
  };

  return (
    <div className='w-full py-8 min-h-[calc(100vh-200px)] flex flex-col'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold'>New Event</h1>
        <p className='text-muted-foreground text-sm mt-1'>
          Create a new event to store your moments
        </p>
      </div>

      <div className='space-y-6 flex-1 w-full'>
        <div className='space-y-2'>
          <Label>Cover Image</Label>
          <div className='flex cursor-pointer flex-col items-center'>
            {coverImage.preview ? (
              <div className='relative w-full h-64 mb-4 group'>
                <Image
                  src={coverImage.preview || '/placeholder.svg'}
                  alt='Cover preview'
                  fill
                  className='object-cover rounded-md'
                />
                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-md'></div>
                <Button
                  variant='outline'
                  size='icon'
                  className='absolute top-2 h-6 w-6 right-2 opacity-80 hover:opacity-100'
                  onClick={handleRemoveImage}
                  aria-label='Remove image'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed border-gray-300 rounded-md p-8 w-full flex flex-col items-center justify-center mb-4 h-64 transition-colors duration-200',
                  'hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900',
                  isDragActive && 'border-primary bg-primary/5'
                )}
              >
                <input {...getInputProps()} />
                <ImageIcon className='h-7 w-7 text-gray-400 mb-2' />
                <p className='text-sm text-gray-500 mb-4 text-center'>
                  {isDragActive
                    ? 'Drop the image here'
                    : 'Drag and drop an image, or click to select'}
                </p>
                <p className='text-xs text-gray-400'>
                  Recommended size: 1200 x 630px (Max: 5MB)
                </p>
              </div>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='space-y-2 md:col-span-3'>
            <Label htmlFor='name'>Event Name*</Label>
            <Input
              id='name'
              name='name'
              value={formData.name}
              className='h-12'
              onChange={handleInputChange}
              placeholder='Summer Party'
              required
            />
          </div>

          <div className='space-y-2 md:col-span-1'>
            <Label htmlFor='date'>Event Date*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id='date'
                  variant='outline'
                  className={cn(
                    'w-full h-12 justify-start text-left font-normal',
                    !formData.date && 'text-muted-foreground'
                  )}
                >
                  {formData.date ? (
                    format(formData.date, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <CalendarComponent
                  mode='single'
                  selected={formData.date}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className='space-y-2'>
          <LocationInput
            value={formData.location}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, location: value }))
            }
            required
            placeholder='123 Main St, City'
          />
        </div>

        <div className='space-y-2 md:col-span-3'>
          <Label htmlFor='description'>Description</Label>
          <Textarea
            id='description'
            name='description'
            value={formData.description}
            onChange={handleInputChange}
            placeholder='Additional details about the event...'
            rows={6}
          />
        </div>

        <div className='flex justify-end gap-3 pt-4'>
          <Button
            variant='outline'
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateEvent} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
