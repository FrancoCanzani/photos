'use server';

import { s3Client } from '../s3';
import { ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';

async function listBuckets() {
  try {
    const response = await s3Client.send(new ListBucketsCommand({}));
    console.log(response.Buckets);
  } catch (error) {
    console.error('Error listing buckets:', error);
  }
}

async function uploadFile(file: File) {
  try {
    const response = await s3Client.send(
      new PutObjectCommand({
        Bucket: 'tests',
        Key: file.name, // generate a unique key
        Body: file,
        ContentType: file.type,
      })
    );
    console.log('Upload successful:', response);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

export { listBuckets, uploadFile };
