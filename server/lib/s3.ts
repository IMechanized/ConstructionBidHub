import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || '';

interface UploadResult {
  url: string;
  key: string;
}

export async function uploadToS3(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder: string = '',
  userId?: number
): Promise<UploadResult> {
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  const fileExtension = filename.split('.').pop();
  const uniqueFilename = `${randomUUID()}.${fileExtension}`;
  
  // Construct user-specific folder path if userId is provided
  let key: string;
  if (userId) {
    key = folder ? `users/${userId}/${folder}/${uniqueFilename}` : `users/${userId}/${uniqueFilename}`;
  } else {
    key = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read',
  });

  try {
    await s3Client.send(command);
    
    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    
    return { url, key };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

export async function uploadImageToS3(buffer: Buffer, filename: string, userId?: number): Promise<string> {
  const mimeType = getMimeTypeFromFilename(filename);
  const result = await uploadToS3(buffer, filename, mimeType, 'images', userId);
  return result.url;
}

export async function uploadDocumentToS3(buffer: Buffer, filename: string, mimeType: string, userId?: number): Promise<string> {
  const result = await uploadToS3(buffer, filename, mimeType, 'documents', userId);
  return result.url;
}

export async function uploadAttachmentToS3(buffer: Buffer, filename: string, mimeType: string, userId?: number): Promise<string> {
  const result = await uploadToS3(buffer, filename, mimeType, 'attachments', userId);
  return result.url;
}

function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}
