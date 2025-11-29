import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

  // Note: ACL parameter removed to support modern S3 buckets with ACLs disabled
  // Ensure your S3 bucket has public read access via bucket policy if files need to be publicly accessible
  // Example bucket policy for public read:
  // {
  //   "Version": "2012-10-17",
  //   "Statement": [{
  //     "Sid": "PublicReadGetObject",
  //     "Effect": "Allow",
  //     "Principal": "*",
  //     "Action": "s3:GetObject",
  //     "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
  //   }]
  // }
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
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

export interface PresignedUploadData {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  fields?: Record<string, string>;
}

export async function generatePresignedUploadUrl(
  filename: string,
  mimeType: string,
  folder: string,
  userId: number,
  expiresIn: number = 3600
): Promise<PresignedUploadData> {
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not configured');
  }

  const fileExtension = filename.split('.').pop();
  const uniqueFilename = `${randomUUID()}.${fileExtension}`;
  
  const key = `users/${userId}/${folder}/${uniqueFilename}`;

  // Note: ACL parameter removed for compatibility with S3 buckets that have ACLs disabled
  // Files uploaded via presigned URLs will inherit the bucket's default permissions
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: mimeType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    
    const region = process.env.AWS_REGION || 'us-east-1';
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    
    return {
      uploadUrl,
      fileUrl,
      key,
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned upload URL');
  }
}

export async function generateImageUploadUrl(filename: string, userId: number): Promise<PresignedUploadData> {
  const mimeType = getMimeTypeFromFilename(filename);
  return generatePresignedUploadUrl(filename, mimeType, 'images', userId);
}

export async function generateDocumentUploadUrl(filename: string, mimeType: string, userId: number): Promise<PresignedUploadData> {
  return generatePresignedUploadUrl(filename, mimeType, 'documents', userId);
}

export async function generateAttachmentUploadUrl(filename: string, mimeType: string, userId: number): Promise<PresignedUploadData> {
  return generatePresignedUploadUrl(filename, mimeType, 'attachments', userId);
}

export function extractS3KeyFromUrl(url: string, bucket: string): string | null {
  try {
    // Handle virtual-hosted style: https://bucket.s3.region.amazonaws.com/key
    if (url.includes('.s3.') && url.includes('.amazonaws.com/')) {
      const parts = url.split('.amazonaws.com/');
      return parts[1] ? decodeURIComponent(parts[1].split('?')[0]) : null;
    }
    
    // Handle path-style: https://s3.region.amazonaws.com/bucket/key
    if (url.includes('s3.') && url.includes('.amazonaws.com/')) {
      const pathPart = url.split('.amazonaws.com/')[1];
      if (pathPart && pathPart.startsWith(bucket + '/')) {
        return decodeURIComponent(pathPart.substring(bucket.length + 1).split('?')[0]);
      }
    }
    
    // Handle CloudFront or custom domain - extract from path
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    if (pathname.startsWith('/')) {
      return decodeURIComponent(pathname.substring(1));
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
}

export async function generatePresignedDownloadUrl(
  s3Key: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not configured');
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  try {
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return downloadUrl;
  } catch (error) {
    console.error('Error generating presigned download URL:', error);
    throw new Error('Failed to generate presigned download URL');
  }
}
