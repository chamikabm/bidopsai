import { useState, useCallback } from 'react';
import {
  uploadFilesToS3,
  validateFiles,
  type UploadProgress,
} from '@/lib/api/s3';

interface UseFileUploadOptions {
  onSuccess?: (files: File[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: UploadProgress[]) => void;
}

interface UseFileUploadReturn {
  uploadFiles: (files: File[], presignedUrls: Array<{ url: string; fileName: string; expiresAt: string }>) => Promise<void>;
  isUploading: boolean;
  progress: UploadProgress[];
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for uploading files to S3 with progress tracking
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { onSuccess, onError, onProgress } = options;
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const uploadFiles = useCallback(
    async (
      files: File[],
      presignedUrls: Array<{ url: string; fileName: string; expiresAt: string }>
    ) => {
      // Validate files before upload
      const validation = validateFiles(files);
      if (!validation.valid) {
        const validationError = new Error(validation.errors.join(', '));
        setError(validationError);
        onError?.(validationError);
        return;
      }

      setIsUploading(true);
      setError(null);
      setProgress([]);

      try {
        await uploadFilesToS3(files, presignedUrls, (fileProgress) => {
          setProgress(fileProgress);
          onProgress?.(fileProgress);
        });

        onSuccess?.(files);
      } catch (err) {
        const uploadError = err instanceof Error ? err : new Error('Upload failed');
        setError(uploadError);
        onError?.(uploadError);
      } finally {
        setIsUploading(false);
      }
    },
    [onSuccess, onError, onProgress]
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress([]);
    setError(null);
  }, []);

  return {
    uploadFiles,
    isUploading,
    progress,
    error,
    reset,
  };
}