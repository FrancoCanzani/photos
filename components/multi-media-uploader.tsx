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

export function MultiMediaUploader({ eventId }: { eventId: string }) {
  const supabase = createClient();
  const { userId } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const router = useRouter();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles((prevImages) => [...prevImages, ...acceptedFiles]);
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    multiple: true,
  });

  const removeImage = (index: number) => {
    const newImages = files.filter((_, i) => i !== index);
    setFiles(newImages);
  };

  async function handleUploadFiles() {
    const uploadResults: { file: File; success: boolean; error?: string }[] =
      [];

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const uploadWithRetry = async (
      file: File,
      retryCount = 0
    ): Promise<boolean> => {
      try {
        const fileKey = `${file.name}-${self.crypto.randomUUID()}`;

        toast.loading(`Uploading ${file.name}...`);

        const response = await uploadFile(file, fileKey);

        if (response?.$metadata.httpStatusCode === 200) {
          const filePath = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/tests/${fileKey}`;

          const { data, error } = await supabase.from('moments').insert({
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

          if (error) throw error;

          toast.success(`Uploaded ${file.name}`);

          return true;
        }
        throw new Error('Upload failed');
      } catch (error) {
        if (retryCount < MAX_RETRIES) {
          await delay(RETRY_DELAY * (retryCount + 1));
          return uploadWithRetry(file, retryCount + 1);
        }

        toast.error(`Error uploading ${file.name}...`);
        return false;
      }
    };

    await Promise.all(
      files.map(async (file) => {
        const success = await uploadWithRetry(file);

        uploadResults.push({
          file,
          success,
          error: success ? undefined : 'Failed after max retries',
        });
      })
    );

    setFiles(files.filter((_, index) => !uploadResults[index].success));
    router.refresh();

    return uploadResults;
  }

  return (
    <div className='w-full max-w-md mx-auto'>
      <div
        {...getRootProps()}
        className={`p-6 mt-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-gray-300 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className='text-primary'>Drop the images here ...</p>
        ) : (
          <p>
            Drag &apos;n&apos; drop some images here, or click to select images
          </p>
        )}
      </div>

      {files.length > 0 && (
        <div className='mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4'>
          {files.map((file, index) => (
            <div key={index} className='relative group'>
              <Image
                src={URL.createObjectURL(file) || '/placeholder.svg'}
                alt={`Uploaded image ${index + 1}`}
                width={150}
                height={150}
                className='w-full h-auto rounded-lg object-cover'
              />
              <button
                onClick={() => removeImage(index)}
                className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                aria-label={`Remove image ${index + 1}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className='py-6 flex items-center justify-evenly'>
        <button
          disabled={!files}
          onClick={() => {
            handleUploadFiles();
          }}
        >
          Upload images
        </button>
      </div>
    </div>
  );
}
