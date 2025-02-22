'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { X } from 'lucide-react';
import { uploadFile } from '@/lib/api/actions';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function MultiMediaUploadDialog({
  eventId,
}: {
  eventId: string;
}) {
  const supabase = createClient();
  const { userId } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
    if (!files.length) return;

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
          toast.message(`Uploaded ${successCount} of ${totalFiles} files`);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (successCount === totalFiles) {
        toast.success('All files uploaded successfully!', { id: toastId });
        setIsOpen(false);
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
      router.refresh();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size={'sm'}>
          Upload Media
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
        </DialogHeader>

        <div className='w-full'>
          <div
            {...getRootProps()}
            className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className='text-primary'>Drop the images here ...</p>
            ) : (
              <p>Drag &apos;n&apos; drop images here, or click to select</p>
            )}
          </div>

          {files.length > 0 && (
            <>
              <div className='max-h-[300px] overflow-y-scroll mt-6'>
                <div className='grid grid-cols-2 gap-4 pr-4'>
                  {files.map((file, index) => (
                    <div key={index} className='relative group'>
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        width={150}
                        height={150}
                        className='w-full h-44 rounded-md object-cover'
                      />
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() => removeImage(index)}
                        className='absolute top-2 size-6 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {isUploading && (
                <div className='mt-4'>
                  <Progress value={progress} className='w-full' />
                  <p className='text-sm text-center mt-2'>
                    Uploading... {Math.round(progress)}%
                  </p>
                </div>
              )}

              <div className='mt-6 flex justify-end gap-3'>
                <Button
                  variant='outline'
                  onClick={() => setIsOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadFiles}
                  disabled={isUploading || !files.length}
                >
                  {isUploading ? (
                    <>Uploading</>
                  ) : (
                    <>
                      Upload {files.length} file{files.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
