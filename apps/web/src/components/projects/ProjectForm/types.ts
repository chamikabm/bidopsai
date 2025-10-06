/**
 * Project Form Types
 */

export interface ProjectFormData {
  name: string;
  description?: string;
  deadline: string;
  files: File[];
  knowledgeBaseIds: string[];
  memberIds: string[];
}

export interface FileUploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface PresignedUrlResponse {
  fileName: string;
  fileType: string;
  presignedUrl: string;
  s3Key: string;
}
