'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { X } from 'lucide-react';
import { listBuckets, uploadFile } from '@/lib/api/actions';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/use-auth';

export function MultiMediaUploader() {
  const supabase = createClient();
  const { userId } = useAuth();
  const [files, setFles] = useState<File[]>([]);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFles((prevImages) => [...prevImages, ...acceptedFiles]);
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
    setFles(newImages);
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
        const response = await uploadFile(file);

        console.log(response);

        if (response?.$metadata.httpStatusCode === 200) {
          const { data, error } = await supabase.from('photos').insert({
            key: file.name,
            user_id: userId,
            bucket: 'tests',
            event_id: 1,
            size: file.size,
            type: file.type,
            updated_at: new Date(),
            file_path: '',
          });

          console.log(data);

          if (error) throw error;
          return true;
        }
        throw new Error('Upload failed');
      } catch (error) {
        if (retryCount < MAX_RETRIES) {
          await delay(RETRY_DELAY * (retryCount + 1));
          return uploadWithRetry(file, retryCount + 1);
        }
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

    setFles(files.filter((_, index) => !uploadResults[index].success));

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
        <button onClick={async () => await listBuckets()}>List buckets</button>
        <button
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
