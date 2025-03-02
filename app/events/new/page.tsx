'use client';

import { useState, useCallback } from 'react';
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
import Image from 'next/image';
import { ImageIcon, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Badge } from '@/components/ui/badge';

type AccessLevel = 'view' | 'edit';

interface Cohost {
  email: string;
  accessLevel: AccessLevel;
}

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewEmailInput, setViewEmailInput] = useState('');
  const [editEmailInput, setEditEmailInput] = useState('');
  const [cohosts, setCohosts] = useState<Cohost[]>([]);

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: new Date(),
    location: '',
    description: '',
    cover: undefined,
    cohosts: [],
  });

  const [coverImage, setCoverImage] = useState<{
    file: File | null;
    preview: string | null;
  }>({
    file: null,
    preview: null,
  });

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

  const handleViewEmailInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setViewEmailInput(e.target.value);
  };

  const handleEditEmailInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditEmailInput(e.target.value);
  };

  const handleEmailKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    accessLevel: AccessLevel
  ) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      addCohost(accessLevel);
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (cohosts.some((cohost) => cohost.email === email)) {
      toast.error('This email has already been added');
      return false;
    }

    return true;
  };

  const addCohost = (accessLevel: AccessLevel) => {
    const email =
      accessLevel === 'view' ? viewEmailInput.trim() : editEmailInput.trim();

    if (!validateEmail(email)) return;

    setCohosts([...cohosts, { email, accessLevel }]);

    if (accessLevel === 'view') {
      setViewEmailInput('');
    } else {
      setEditEmailInput('');
    }
  };

  const removeCohost = (email: string) => {
    setCohosts(cohosts.filter((cohost) => cohost.email !== email));
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

    const eventDataToSubmit = {
      ...formData,
      cohosts: cohosts,
    };

    try {
      if (coverImage.file && eventDataToSubmit.cover) {
        const fileUploadResult = await uploadFile(
          coverImage.file,
          eventDataToSubmit.cover,
          'cover-images'
        );

        if (fileUploadResult.error) {
          toast.error('Error saving event cover. Try again later!');
          setIsSubmitting(false);
          return;
        }
      }

      const result = await createEvent(eventDataToSubmit);

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
        <h1 className='text-xl font-medium'>New Event</h1>
        <p className='text-muted-foreground text-sm mt-1'>
          Create a new event to store your moments
        </p>
      </div>

      <div className='space-y-4 flex-1 w-full'>
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

        <div className='grid grid-cols-1 md:grid-cols-4 gap-2'>
          <div className='space-y-1.5 md:col-span-3'>
            <Label htmlFor='name'>Event Name*</Label>
            <Input
              id='name'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              placeholder='Summer Party'
              required
            />
          </div>

          <div className='space-y-1.5 md:col-span-1'>
            <Label htmlFor='date'>Event Date*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id='date'
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
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

        <div className='space-y-1.5'>
          <Label>Location</Label>
          <Input
            id='location'
            name='location'
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
            required
            placeholder='123 Main St, City'
          />
        </div>

        <div className='space-y-1.5'>
          <Label>Co-hosts</Label>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
            <div className='space-y-1.5'>
              <span className='text-sm text-muted-foreground'>
                View-only access
              </span>
              <div className='relative'>
                <Input
                  type='email'
                  placeholder='Add viewer by email'
                  value={viewEmailInput}
                  onChange={handleViewEmailInputChange}
                  onKeyDown={(e) => handleEmailKeyDown(e, 'view')}
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <span className='text-sm text-muted-foreground'>Edit access</span>
              <div className='relative'>
                <Input
                  type='email'
                  placeholder='Add editor by email'
                  value={editEmailInput}
                  onChange={handleEditEmailInputChange}
                  onKeyDown={(e) => handleEmailKeyDown(e, 'edit')}
                />
              </div>
            </div>
          </div>

          {cohosts.length > 0 && (
            <div className='space-y-1.5 mt-4'>
              <div className='flex flex-wrap gap-2'>
                {cohosts.map((cohost) => (
                  <div
                    key={cohost.email}
                    className='flex items-center bg-secondary rounded-md pl-3 pr-1 py-1'
                  >
                    <span className='text-sm mr-2 max-w-[200px] truncate'>
                      {cohost.email}
                    </span>
                    <Badge
                      variant={'default'}
                      className='mr-1 text-xs font-normal rounded-md'
                    >
                      {cohost.accessLevel === 'view' ? (
                        <span>View</span>
                      ) : (
                        <span>Edit</span>
                      )}
                    </Badge>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-5 w-5'
                      onClick={() => removeCohost(cohost.email)}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
