import api from './client';

/**
 * Presigned URL data returned by the Django backend.
 */
export interface PresignedUploadResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  fileUrl: string;
}

/**
 * Request a presigned S3 POST URL from the backend.
 */
export async function requestPresignedUrl(
  fileName: string,
  contentType: string,
  folder: string = 'uploads',
): Promise<PresignedUploadResponse> {
  const { data } = await api.post('/upload/presigned/', {
    fileName,
    contentType,
    folder,
  });
  return data;
}

/**
 * Upload a file directly to S3 using a presigned POST URL.
 *
 * Uses XMLHttpRequest instead of fetch to support upload progress tracking.
 */
export function uploadToS3(
  file: File,
  presignedData: PresignedUploadResponse,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();

    // Append all presigned fields first (order matters for S3)
    Object.entries(presignedData.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // File must be the last field
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(presignedData.fileUrl);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to a network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    xhr.open('POST', presignedData.uploadUrl);
    xhr.send(formData);
  });
}

/**
 * High-level upload function: requests presigned URL then uploads to S3.
 *
 * Returns the final public URL of the uploaded file.
 */
export async function uploadImage(
  file: File,
  folder: string = 'uploads',
  onProgress?: (percent: number) => void,
): Promise<string> {
  const presignedData = await requestPresignedUrl(
    file.name,
    file.type,
    folder,
  );
  return uploadToS3(file, presignedData, onProgress);
}
