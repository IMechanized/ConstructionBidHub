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
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload file');
    }

    const data = await response.json();
    console.log('Upload successful:', data.url);
    return data.url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
