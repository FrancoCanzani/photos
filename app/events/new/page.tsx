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
    notes: '',
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
    <div className='container max-w-4xl mx-auto py-8 px-4 min-h-[calc(100vh-200px)] flex flex-col'>
      <div className='mb-8'>
        <h1 className='text-xl text-center font-medium'>New Event</h1>
        <h2 className='text-muted-foreground text-sm text-center mt-1'>
          Create a new event to store your moments
        </h2>
        <div className='flex items-center justify-center mt-7'>
          <div className='flex items-center'>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep >= 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {currentStep > 1 ? <Check className='h-4 w-4' /> : 1}
            </div>
            <span className='ml-2 font-medium'>Event Details</span>
          </div>
          <div className='w-16 h-0.5 mx-2 bg-muted'>
            <div
              className={`h-full bg-primary ${
                currentStep >= 2 ? 'w-full' : 'w-0'
              }`}
            ></div>
          </div>
          <div className='flex items-center'>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep >= 2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {currentStep > 2 ? <Check className='h-4 w-4' /> : 2}
            </div>
            <span className='ml-2 font-medium'>Upload Media</span>
          </div>
          <div className='w-16 h-0.5 mx-2 bg-muted'>
            <div
              className={`h-full bg-primary ${
                currentStep >= 3 ? 'w-full' : 'w-0'
              }`}
            ></div>
          </div>
          <div className='flex items-center'>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep >= 3
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {currentStep > 3 ? <Check className='h-4 w-4' /> : 3}
            </div>
            <span className='ml-2 font-medium'>Complete</span>
          </div>
        </div>
      </div>

      {currentStep === 1 && (
        <div className='space-y-4 flex-1'>
          <p className='text-muted-foreground'>
            Let's start with some details about your event. Don't worry, you can
            always edit these later.
          </p>
          <div className='space-y-2'>
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

          <div className='space-y-2'>
            <Label htmlFor='date'>Event Date*</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id='date'
                  variant='outline'
                  className={cn(
                    'col-span-3 justify-start text-left font-normal flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
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

          <div className='space-y-2'>
            <Label htmlFor='location'>Location*</Label>
            <Input
              id='location'
              name='location'
              value={formData.location}
              onChange={handleInputChange}
              placeholder='123 Main St, City'
              className='h-12'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea
              id='notes'
              name='notes'
              value={formData.notes}
              onChange={handleInputChange}
              placeholder='Additional details about the event...'
              rows={6}
            />
          </div>

          <div className='flex justify-end pt-4'>
            <Button
              onClick={handleCreateEvent}
              disabled={!formData.name || !formData.location}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className='space-y-6 flex-1 flex flex-col'>
          <p className='text-muted-foreground'>
            You can upload images for your event. This is optional, you can skip
            this step if you want.
          </p>
          <div
            {...getRootProps()}
            className={`p-12 flex-1 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors flex flex-col justify-center items-center min-h-[300px] ${
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <ImageIcon className='h-8 w-8 mx-auto mb-4 text-muted-foreground' />
            {isDragActive ? (
              <p className='text-primary font-medium'>
                Drop the images here ...
              </p>
            ) : (
              <>
                <p className='font-medium'>
                  Drag & drop images here, or click to select
                </p>
                <p className='text-sm text-muted-foreground mt-1'>
                  (10MB max per file)
                </p>
              </>
            )}
          </div>

          {files.length > 0 && (
            <>
              <div className='mt-6'>
                <h3 className='text-lg font-medium mb-3'>
                  Selected Images ({files.length})
                </h3>
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                  {files.map((file, index) => (
                    <div key={index} className='relative group aspect-square'>
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        fill
                        className='rounded-md object-cover'
                      />
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() => removeImage(index)}
                        className='absolute top-2 right-2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {isUploading && (
                <div className='mt-6'>
                  <Progress value={progress} className='w-full h-2' />
                  <p className='text-sm text-center mt-2'>
                    Uploading... {Math.round(progress)}%
                  </p>
                </div>
              )}
            </>
          )}

          <div className='flex justify-between pt-6 mt-auto'>
            <Button variant='outline' onClick={() => setStep('3')}>
              Skip
            </Button>
            <Button
              onClick={handleUploadFiles}
              disabled={isUploading || !files.length}
            >
              {isUploading ? (
                <>Uploading...</>
              ) : (
                <>
                  Upload {files.length}{' '}
                  {files.length === 1 ? 'image' : 'images'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className='space-y-6 text-center flex-1 flex flex-col'>
          <div className='py-12 flex-1 flex flex-col justify-center'>
            <div className='w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6'>
              <Check className='h-10 w-10 text-green-600' />
            </div>
            <h2 className='text-2xl font-bold mb-2'>
              Event Created Successfully!
            </h2>
            <p className='text-muted-foreground'>
              Your event has been created and your media has been uploaded.
            </p>
          </div>

          <div className='flex justify-center pt-6'>
            <Button onClick={handleFinish}>View Event</Button>
          </div>
        </div>
      )}
    </div>
  );
}
