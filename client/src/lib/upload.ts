export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

// Upload file using presigned URL with progress tracking (Vercel-compatible, supports up to 350MB)
export async function uploadFileWithPresignedUrl(
  file: File, 
  endpoint: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  try {
    console.log('Starting presigned URL upload:', file.name);
    
    // Step 1: Request presigned URL from backend
    const presignedResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
      }),
    });

    if (!presignedResponse.ok) {
      let errorMessage = 'Failed to get upload URL';
      try {
        const errorData = await presignedResponse.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Failed to get upload URL: ${presignedResponse.statusText || presignedResponse.status}`;
      }
      throw new Error(errorMessage);
    }

    const { uploadUrl, fileUrl } = await presignedResponse.json();
    
    // Step 2: Upload directly to S3 using XMLHttpRequest for progress tracking
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage,
          });
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Upload successful:', fileUrl);
          resolve(fileUrl);
        } else {
          // Enhanced error logging to diagnose S3 issues
          let errorDetails = `${xhr.status} ${xhr.statusText}`;
          if (xhr.responseText) {
            console.error('S3 Error Response:', xhr.responseText);
            errorDetails += ` - ${xhr.responseText}`;
          }
          reject(new Error(`S3 upload failed: ${errorDetails}`));
        }
      });
      
      // Handle network errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      // Handle aborts
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });
      
      // Open connection and set headers
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);
      
      // Send the file
      xhr.send(file);
    });
  } catch (error) {
    console.error('Error uploading file with presigned URL:', error);
    throw error;
  }
}

// Upload image using presigned URL
export async function uploadImage(file: File, onProgress?: UploadProgressCallback): Promise<string> {
  return uploadFileWithPresignedUrl(file, '/api/upload/presigned-url', onProgress);
}

// Upload document using presigned URL
export async function uploadDocument(file: File, onProgress?: UploadProgressCallback): Promise<string> {
  return uploadFileWithPresignedUrl(file, '/api/upload-document/presigned-url', onProgress);
}

// Upload attachment using presigned URL
export async function uploadAttachment(file: File, onProgress?: UploadProgressCallback): Promise<string> {
  return uploadFileWithPresignedUrl(file, '/api/upload-attachment/presigned-url', onProgress);
}

// Legacy upload function using multipart form data (limited to 4.5MB on Vercel)
export async function uploadFile(file: File): Promise<string> {
  try {
    console.log('Starting file upload:', file.name);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = 'Failed to upload file';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON (e.g., HTML error page), use the status text
        errorMessage = `Upload failed: ${response.statusText || response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Upload successful:', data.url);
    return data.url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
