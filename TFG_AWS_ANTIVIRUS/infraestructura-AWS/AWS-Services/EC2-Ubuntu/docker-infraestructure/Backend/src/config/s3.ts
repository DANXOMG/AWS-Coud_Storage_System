import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export const S3_BUCKET = process.env.S3_BUCKET || 'usuarios-drive';
export const S3_REGION = process.env.S3_REGION || 'us-east-1';

const s3Client = new S3Client({
  region: S3_REGION,
  // Sin credenciales hardcodeadas — el SDK las detecta automáticamente:
  // 1. Variables de entorno AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
  // 2. ~/.aws/credentials
  // 3. LabRole via IMDSv2 (EC2 instance profile) ← esto es lo que usamos
});

// Test conexión
s3Client
  .send(new ListBucketsCommand({}))
  .then(() => {
    console.log('[+] S3 conectado correctamente (LabRole)');
  })
  .catch((err) => {
    console.error('[!] Fallo de conexión con S3:', err.message);
  });

export default s3Client;