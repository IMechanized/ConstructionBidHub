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
