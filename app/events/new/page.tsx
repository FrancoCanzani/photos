'use client';

import { useCallback, useState, useEffect } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Check, ImageIcon, X } from 'lucide-react';
import { uploadFile } from '@/lib/api/actions';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { createEvent, type EventFormData } from '@/lib/api/actions';
import { useQueryState } from 'nuqs';
import { LocationInput } from '@/components/location-input';

export default function NewEventPage() {
  const supabase = createClient();
  const { userId } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const [step, setStep] = useQueryState('step', {
    defaultValue: '1',
    parse: (value) => value,
    serialize: (value) => value,
  });
  const [eventId, setEventId] = useState<string | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    date: new Date(),
    location: '',
    description: '',
  });

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const currentStep = parseInt(step || '1');

  useEffect(() => {
    // If user navigates directly to a step but doesn't have an event ID for step 2+
    if (currentStep >= 2 && !eventId) {
      setStep('1');
    }
  }, [currentStep, eventId, setStep]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    multiple: true,
    maxSize: MAX_FILE_SIZE,
  });

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadWithRetry = async (
    file: File,
    retryCount = 0
  ): Promise<boolean> => {
    try {
      const fileKey = `${file.name}-${self.crypto.randomUUID()}`;
      const filePath = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/tests/${fileKey}`;

      const response = await uploadFile(file, fileKey);

      if (response?.data?.$metadata.httpStatusCode === 200) {
        const { error } = await supabase.from('moments').insert({
          key: fileKey,
          name: file.name,
          user_id: userId,
          bucket: 'tests',
          event_id: eventId,
          size: file.size,
          type: file.type,
          updated_at: new Date(),
          file_path: filePath,
        });

        if (error) {
          throw error;
        }
        return true;
      }
      throw new Error('Upload failed');
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * (retryCount + 1))
        );
        return uploadWithRetry(file, retryCount + 1);
      }
      return false;
    }
  };

  const handleUploadFiles = async () => {
    if (!files.length || !eventId) return;

    setIsUploading(true);
    const toastId = toast.loading('Starting upload...');

    try {
      let successCount = 0;
      const totalFiles = files.length;
      const results: boolean[] = [];

      for (const file of files) {
        const success = await uploadWithRetry(file);
        results.push(success);

        if (success) {
          successCount++;
          setProgress((successCount / totalFiles) * 100);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (successCount === totalFiles) {
        toast.success('All files uploaded successfully!', { id: toastId });
        setStep('3');
      } else {
        toast.error(`Uploaded ${successCount} of ${totalFiles} files`, {
          id: toastId,
        });
      }

      setFiles((prev) => prev.filter((_, index) => !results[index]));
    } catch (error) {
      toast.error('Upload failed', { id: toastId });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

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

  const handleCreateEvent = async () => {
    try {
      const result = await createEvent(formData);

      if (result.error) {
        toast.error('Error creating event. Try again later!');
        return;
      }

      toast.success('Event created successfully!');
      setEventId(result.data.id);
      setStep('2');
    } catch (error) {
      toast.error('Failed to create event. Try again later!');
    }
  };

  const handleFinish = () => {
    router.push(`/events/${eventId}`);
  };

  return (
    <div className='mx-auto w-full py-8 min-h-[calc(100vh-200px)] flex flex-col'>
      <div className='mb-8'>
        <h1 className='text-xl font-medium'>New Event</h1>
        <h2 className='text-muted-foreground text-sm mt-1'>
          Create a new event to store your moments
        </h2>
      </div>

      <div className='space-y-4 flex-1 w-full'>
        <div className='flex w-full items-center justify-evenly space-x-2'>
          <div className='space-y-2 w-3/4'>
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
          <div className='space-y-2 w-1/4'>
            <Label htmlFor='date'>Event Date*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id='date'
                  variant='outline'
                  className={cn(
                    'col-span-3 justify-start text-left font-normal flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
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
              <PopoverContent className='w-auto p-0'>
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

        <div className='flex justify-end pt-4'>
          <Button
            onClick={handleCreateEvent}
            disabled={!formData.name || !formData.location}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
