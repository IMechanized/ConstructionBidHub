// Upload file using presigned URL (Vercel-compatible, supports up to 350MB)
export async function uploadFileWithPresignedUrl(file: File, endpoint: string): Promise<string> {
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
    
    // Step 2: Upload directly to S3 using presigned URL
    // Note: ACL header removed to support modern S3 buckets with ACLs disabled
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      // Enhanced error logging to diagnose S3 issues
      let errorDetails = `${uploadResponse.status} ${uploadResponse.statusText}`;
      try {
        const errorText = await uploadResponse.text();
        if (errorText) {
          console.error('S3 Error Response:', errorText);
          errorDetails += ` - ${errorText}`;
        }
      } catch (e) {
        // Ignore parse errors
      }
      throw new Error(`S3 upload failed: ${errorDetails}`);
    }

    console.log('Upload successful:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Error uploading file with presigned URL:', error);
    throw error;
  }
}

// Upload image using presigned URL
export async function uploadImage(file: File): Promise<string> {
  return uploadFileWithPresignedUrl(file, '/api/upload/presigned-url');
}

// Upload document using presigned URL
export async function uploadDocument(file: File): Promise<string> {
  return uploadFileWithPresignedUrl(file, '/api/upload-document/presigned-url');
}

// Upload attachment using presigned URL
export async function uploadAttachment(file: File): Promise<string> {
  return uploadFileWithPresignedUrl(file, '/api/upload-attachment/presigned-url');
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
