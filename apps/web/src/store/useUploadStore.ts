/**
 * Upload Store
 * 
 * Manages file upload state, progress, and queue
 * Handles direct S3 uploads via presigned URLs
 */

import { create } from 'zustand';

// ============================================
// Types
// ============================================

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: UploadStatus;
  progress: number;
  url?: string; // S3 URL after upload
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  presignedUrl?: string;
  abortController?: AbortController;
}

export interface UploadState {
  // Upload queue
  uploads: Map<string, UploadFile>;
  
  // Add file to upload queue
  addUpload: (file: File, presignedUrl: string) => string;
  
  // Add multiple files
  addUploads: (files: File[], presignedUrls: string[]) => string[];
  
  // Update upload progress
  updateProgress: (id: string, progress: number) => void;
  
  // Update upload status
  updateStatus: (id: string, status: UploadStatus, error?: string) => void;
  
  // Set upload URL (after completion)
  setUploadUrl: (id: string, url: string) => void;
  
  // Cancel upload
  cancelUpload: (id: string) => void;
  
  // Retry failed upload
  retryUpload: (id: string) => void;
  
  // Remove upload from queue
  removeUpload: (id: string) => void;
  
  // Clear completed uploads
  clearCompleted: () => void;
  
  // Clear all uploads
  clearAll: () => void;
  
  // Get upload by ID
  getUpload: (id: string) => UploadFile | undefined;
  
  // Get uploads by status
  getUploadsByStatus: (status: UploadStatus) => UploadFile[];
  
  // Get all uploads as array
  getAllUploads: () => UploadFile[];
  
  // Check if any uploads are in progress
  hasActiveUploads: () => boolean;
  
  // Get upload statistics
  getStats: () => {
    total: number;
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  
  // Get overall progress (percentage)
  getOverallProgress: () => number;
}

// ============================================
// Store
// ============================================

export const useUploadStore = create<UploadState>((set, get) => ({
  uploads: new Map(),
  
  addUpload: (file, presignedUrl) => {
    const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    set((state) => {
      const newUploads = new Map(state.uploads);
      newUploads.set(id, {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        presignedUrl,
        abortController: new AbortController(),
        startedAt: new Date(),
      });
      
      return { uploads: newUploads };
    });
    
    return id;
  },
  
  addUploads: (files, presignedUrls) => {
    const ids: string[] = [];
    
    set((state) => {
      const newUploads = new Map(state.uploads);
      
      files.forEach((file, index) => {
        const id = `upload-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        ids.push(id);
        
        newUploads.set(id, {
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          progress: 0,
          presignedUrl: presignedUrls[index],
          abortController: new AbortController(),
          startedAt: new Date(),
        });
      });
      
      return { uploads: newUploads };
    });
    
    return ids;
  },
  
  updateProgress: (id, progress) => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      const upload = newUploads.get(id);
      
      if (upload) {
        newUploads.set(id, {
          ...upload,
          progress: Math.min(100, Math.max(0, progress)),
        });
      }
      
      return { uploads: newUploads };
    });
  },
  
  updateStatus: (id, status, error) => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      const upload = newUploads.get(id);
      
      if (upload) {
        const updates: Partial<UploadFile> = {
          status,
          error,
        };
        
        if (status === 'completed') {
          updates.progress = 100;
          updates.completedAt = new Date();
        } else if (status === 'uploading') {
          updates.startedAt = updates.startedAt || new Date();
        }
        
        newUploads.set(id, {
          ...upload,
          ...updates,
        });
      }
      
      return { uploads: newUploads };
    });
  },
  
  setUploadUrl: (id, url) => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      const upload = newUploads.get(id);
      
      if (upload) {
        newUploads.set(id, {
          ...upload,
          url,
        });
      }
      
      return { uploads: newUploads };
    });
  },
  
  cancelUpload: (id) => {
    const upload = get().uploads.get(id);
    
    if (upload?.abortController) {
      upload.abortController.abort();
    }
    
    get().updateStatus(id, 'cancelled');
  },
  
  retryUpload: (id) => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      const upload = newUploads.get(id);
      
      if (upload) {
        newUploads.set(id, {
          ...upload,
          status: 'pending',
          progress: 0,
          error: undefined,
          abortController: new AbortController(),
          startedAt: new Date(),
        });
      }
      
      return { uploads: newUploads };
    });
  },
  
  removeUpload: (id) => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      newUploads.delete(id);
      return { uploads: newUploads };
    });
  },
  
  clearCompleted: () => {
    set((state) => {
      const newUploads = new Map(state.uploads);
      
      Array.from(newUploads.entries()).forEach(([id, upload]) => {
        if (upload.status === 'completed') {
          newUploads.delete(id);
        }
      });
      
      return { uploads: newUploads };
    });
  },
  
  clearAll: () => {
    // Cancel any active uploads first
    Array.from(get().uploads.values()).forEach((upload) => {
      if (upload.status === 'uploading' && upload.abortController) {
        upload.abortController.abort();
      }
    });
    
    set({ uploads: new Map() });
  },
  
  getUpload: (id) => {
    return get().uploads.get(id);
  },
  
  getUploadsByStatus: (status) => {
    return Array.from(get().uploads.values()).filter(
      (upload) => upload.status === status
    );
  },
  
  getAllUploads: () => {
    return Array.from(get().uploads.values());
  },
  
  hasActiveUploads: () => {
    return Array.from(get().uploads.values()).some(
      (upload) => upload.status === 'pending' || upload.status === 'uploading'
    );
  },
  
  getStats: () => {
    const uploads = Array.from(get().uploads.values());
    
    return {
      total: uploads.length,
      pending: uploads.filter((u) => u.status === 'pending').length,
      uploading: uploads.filter((u) => u.status === 'uploading').length,
      completed: uploads.filter((u) => u.status === 'completed').length,
      failed: uploads.filter((u) => u.status === 'failed').length,
      cancelled: uploads.filter((u) => u.status === 'cancelled').length,
    };
  },
  
  getOverallProgress: () => {
    const uploads = Array.from(get().uploads.values());
    
    if (uploads.length === 0) return 0;
    
    const totalProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0);
    return Math.round(totalProgress / uploads.length);
  },
}));

// ============================================
// Selectors
// ============================================

/**
 * Select specific upload
 */
export const useUpload = (id: string) => {
  return useUploadStore((state) => state.getUpload(id));
};

/**
 * Select all uploads
 */
export const useAllUploads = () => {
  return useUploadStore((state) => state.getAllUploads());
};

/**
 * Select uploads by status
 */
export const useUploadsByStatus = (status: UploadStatus) => {
  return useUploadStore((state) => state.getUploadsByStatus(status));
};

/**
 * Select if there are active uploads
 */
export const useHasActiveUploads = () => {
  return useUploadStore((state) => state.hasActiveUploads());
};

/**
 * Select upload statistics
 */
export const useUploadStats = () => {
  return useUploadStore((state) => state.getStats());
};

/**
 * Select overall progress
 */
export const useOverallProgress = () => {
  return useUploadStore((state) => state.getOverallProgress());
};

// ============================================
// Helpers
// ============================================

/**
 * Upload file to S3 using presigned URL
 */
export async function uploadToS3(
  uploadId: string,
  file: File,
  presignedUrl: string
): Promise<void> {
  const store = useUploadStore.getState();
  const upload = store.getUpload(uploadId);
  
  if (!upload) {
    throw new Error('Upload not found');
  }
  
  try {
    store.updateStatus(uploadId, 'uploading');
    
    const xhr = new XMLHttpRequest();
    
    // Track progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        store.updateProgress(uploadId, progress);
      }
    });
    
    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Extract S3 URL from presigned URL (remove query params)
        const url = presignedUrl.split('?')[0];
        store.setUploadUrl(uploadId, url);
        store.updateStatus(uploadId, 'completed');
      } else {
        store.updateStatus(
          uploadId,
          'failed',
          `Upload failed with status ${xhr.status}`
        );
      }
    });
    
    // Handle errors
    xhr.addEventListener('error', () => {
      store.updateStatus(uploadId, 'failed', 'Network error during upload');
    });
    
    xhr.addEventListener('abort', () => {
      store.updateStatus(uploadId, 'cancelled');
    });
    
    // Connect abort controller
    upload.abortController?.signal.addEventListener('abort', () => {
      xhr.abort();
    });
    
    // Send request
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  } catch (error) {
    store.updateStatus(
      uploadId,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

/**
 * Upload multiple files to S3
 */
export async function uploadMultipleToS3(
  files: File[],
  presignedUrls: string[]
): Promise<string[]> {
  const store = useUploadStore.getState();
  const uploadIds = store.addUploads(files, presignedUrls);
  
  // Upload all files in parallel
  await Promise.allSettled(
    uploadIds.map((id, index) =>
      uploadToS3(id, files[index], presignedUrls[index])
    )
  );
  
  return uploadIds;
}

/**
 * Get failed upload IDs
 */
export function getFailedUploadIds(): string[] {
  return useUploadStore
    .getState()
    .getUploadsByStatus('failed')
    .map((upload) => upload.id);
}

/**
 * Retry all failed uploads
 */
export async function retryAllFailedUploads(): Promise<void> {
  const store = useUploadStore.getState();
  const failedUploads = store.getUploadsByStatus('failed');
  
  await Promise.allSettled(
    failedUploads.map((upload) => {
      store.retryUpload(upload.id);
      if (upload.presignedUrl) {
        return uploadToS3(upload.id, upload.file, upload.presignedUrl);
      }
      return Promise.reject(new Error('No presigned URL'));
    })
  );
}