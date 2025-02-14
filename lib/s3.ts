import { S3Client } from '@aws-sdk/client-s3';

if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  throw new Error('Falta CLOUDFLARE_ACCOUNT_ID en las variables de entorno.');
}

if (
  !process.env.CLOUDFLARE_ACCESS_KEY_ID ||
  !process.env.CLOUDFLARE_SECRET_ACCESS_KEY
) {
  throw new Error('Faltan las claves de acceso de Cloudflare R2.');
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

export { s3Client };
