/**
 * S3 File Upload Utilities
 * 
 * Handles uploading files to S3 using presigned URLs from the GraphQL API
 */

export interface PresignedUrlResponse {
  url: string;
  fileName: string;
  expiresAt: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

/**
 * Upload a single file to S3 using a presigned URL
 */
export async function uploadFileToS3(
  file: File,
  presignedUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(Math.round(percentComplete));
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    // Send the file
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Upload multiple files to S3 in parallel
 */
export async function uploadFilesToS3(
  files: File[],
  presignedUrls: PresignedUrlResponse[],
  onProgress?: (fileProgress: UploadProgress[]) => void
): Promise<void> {
  // Create a map of filename to presigned URL
  const urlMap = new Map(
    presignedUrls.map((item) => [item.fileName, item.url])
  );

  // Initialize progress tracking
  const progressMap = new Map<string, UploadProgress>(
    files.map((file) => [
      file.name,
      {
        fileName: file.name,
        progress: 0,
        status: 'pending',
      },
    ])
  );

  // Helper to update progress
  const updateProgress = () => {
    if (onProgress) {
      onProgress(Array.from(progressMap.values()));
    }
  };

  // Upload all files in parallel
  const uploadPromises = files.map(async (file) => {
    const presignedUrl = urlMap.get(file.name);
    if (!presignedUrl) {
      const progress = progressMap.get(file.name)!;
      progress.status = 'failed';
      progress.error = 'No presigned URL found for file';
      updateProgress();
      throw new Error(`No presigned URL found for file: ${file.name}`);
    }

    try {
      // Update status to uploading
      const progress = progressMap.get(file.name)!;
      progress.status = 'uploading';
      updateProgress();

      // Upload the file
      await uploadFileToS3(file, presignedUrl, (fileProgress) => {
        progress.progress = fileProgress;
        updateProgress();
      });

      // Mark as completed
      progress.status = 'completed';
      progress.progress = 100;
      updateProgress();
    } catch (error) {
      // Mark as failed
      const progress = progressMap.get(file.name)!;
      progress.status = 'failed';
      progress.error =
        error instanceof Error ? error.message : 'Upload failed';
      updateProgress();
      throw error;
    }
  });

  // Wait for all uploads to complete
  await Promise.all(uploadPromises);
}

/**
 * Generate S3 file path based on project naming convention
 * Format: yyyy/mm/dd/hh/<url_friendly_project_name>_<timestamp>/<filename>
 */
export function generateS3FilePath(
  projectName: string,
  fileName: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const timestamp = now.getTime();

  // Make project name URL-friendly
  const urlFriendlyName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${year}/${month}/${day}/${hour}/${urlFriendlyName}_${timestamp}/${fileName}`;
}

/**
 * Extract file location from S3 presigned URL
 */
export function extractS3Location(presignedUrl: string): string {
  try {
    const url = new URL(presignedUrl);
    // Remove query parameters to get the raw S3 path
    return `${url.origin}${url.pathname}`;
  } catch {
    throw new Error('Invalid presigned URL');
  }
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds maximum size of 100MB`,
    };
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File "${file.name}" has an unsupported file type`,
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files before upload
 */
export function validateFiles(
  files: File[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check file count
  if (files.length === 0) {
    errors.push('At least one file is required');
  }

  if (files.length > 20) {
    errors.push('Maximum 20 files allowed');
  }

  // Check each file
  files.forEach((file) => {
    const result = validateFile(file);
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}