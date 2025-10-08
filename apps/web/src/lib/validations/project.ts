import { z } from 'zod';

/**
 * Validation schema for creating a new project
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must not exceed 100 characters'),
  
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  
  deadline: z
    .date()
    .min(new Date(), 'Deadline must be in the future')
    .optional()
    .nullable(),
  
  documents: z
    .array(
      z.instanceof(File).refine(
        (file) => {
          // Max file size: 100MB
          const maxSize = 100 * 1024 * 1024;
          return file.size <= maxSize;
        },
        { message: 'File size must not exceed 100MB' }
      ).refine(
        (file) => {
          // Allowed file types
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
          return allowedTypes.includes(file.type);
        },
        { message: 'Invalid file type. Only Word, Excel, PDF, Audio, and Video files are allowed' }
      )
    )
    .min(1, 'At least one document is required')
    .max(20, 'Maximum 20 documents allowed'),
  
  knowledgeBaseIds: z
    .array(z.string().uuid('Invalid knowledge base ID'))
    .default([]),
  
  userIds: z
    .array(z.string().uuid('Invalid user ID'))
    .default([]),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

/**
 * Validation schema for updating a project
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must not exceed 100 characters')
    .optional(),
  
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .nullable(),
  
  deadline: z
    .date()
    .optional()
    .nullable(),
  
  status: z
    .enum([
      'DRAFT',
      'IN_PROGRESS',
      'UNDER_REVIEW',
      'COMPLETED',
      'SUBMITTED',
      'WON',
      'LOST',
      'CANCELLED',
    ])
    .optional(),
  
  progressPercentage: z
    .number()
    .min(0, 'Progress must be at least 0%')
    .max(100, 'Progress must not exceed 100%')
    .optional(),
});

export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;

/**
 * Helper function to get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * Helper function to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Helper function to validate file type by extension
 */
export function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  const validExtensions = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'mp3',
    'wav',
    'mp4',
    'mpeg',
    'mov',
  ];
  
  return validExtensions.includes(ext);
}