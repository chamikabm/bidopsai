/**
 * Validation Utilities
 * 
 * Zod schemas and validation helpers for form inputs and data validation
 */

import { z } from 'zod';
import { ProjectStatus } from '@/types/project.types';
import { KnowledgeBaseScope } from '@/types/knowledgeBase.types';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZES } from './constants';

// ============================================
// Common Schemas
// ============================================

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const urlSchema = z.string().url('Invalid URL format');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

// ============================================
// Auth Schemas
// ============================================

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z.string().min(1, 'First name is required').trim(),
    lastName: z.string().min(1, 'Last name is required').trim(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    code: z.string().min(6, 'Verification code must be 6 digits'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ============================================
// User Schemas
// ============================================

export const createUserSchema = z.object({
  email: emailSchema,
  username: z.string().min(3).max(30),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  profileImageUrl: urlSchema.optional(),
  roleIds: z.array(uuidSchema).min(1, 'At least one role is required'),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  profileImageUrl: urlSchema.optional(),
  preferredLanguage: z.string().optional(),
  themePreference: z.string().optional(),
});

export const userFilterSchema = z.object({
  roleId: uuidSchema.optional(),
  search: z.string().optional(),
});

// ============================================
// Project Schemas
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Project name is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  deadline: z.date().min(new Date(), 'Deadline must be in the future').optional(),
  knowledgeBaseIds: z.array(uuidSchema).optional(),
  userIds: z.array(uuidSchema).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  deadline: z.date().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
});

export const projectFilterSchema = z.object({
  status: z.nativeEnum(ProjectStatus).optional(),
  createdBy: uuidSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
});

// ============================================
// Knowledge Base Schemas
// ============================================

export const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1, 'Knowledge base name is required').max(200),
  description: z.string().max(2000).optional(),
  scope: z.nativeEnum(KnowledgeBaseScope),
  projectId: uuidSchema.optional(),
});

export const knowledgeBaseFilterSchema = z.object({
  scope: z.nativeEnum(KnowledgeBaseScope).optional(),
  projectId: uuidSchema.optional(),
  search: z.string().optional(),
});

// ============================================
// File Upload Schemas
// ============================================

export const fileUploadSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
      })
    )
    .min(1, 'At least one file is required')
    .refine(
      (files) => {
        return files.every((file) => {
          const extension = `.${file.name.split('.').pop()?.toLowerCase()}` as string;
          const allTypes = [
            ...SUPPORTED_FILE_TYPES.DOCUMENTS,
            ...SUPPORTED_FILE_TYPES.SPREADSHEETS,
            ...SUPPORTED_FILE_TYPES.AUDIO,
            ...SUPPORTED_FILE_TYPES.VIDEO,
          ];
          return allTypes.includes(extension as any);
        });
      },
      {
        message: 'One or more files have unsupported file types',
      }
    )
    .refine(
      (files) => {
        return files.every((file) => {
          const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
          if (!extension) return false;

          // Determine category and max size
          let maxSize = 10 * 1024 * 1024; // default 10MB
          if (SUPPORTED_FILE_TYPES.DOCUMENTS.includes(extension as any)) {
            maxSize = MAX_FILE_SIZES.DOCUMENT;
          } else if (SUPPORTED_FILE_TYPES.SPREADSHEETS.includes(extension as any)) {
            maxSize = MAX_FILE_SIZES.SPREADSHEET;
          } else if (SUPPORTED_FILE_TYPES.AUDIO.includes(extension as any)) {
            maxSize = MAX_FILE_SIZES.AUDIO;
          } else if (SUPPORTED_FILE_TYPES.VIDEO.includes(extension as any)) {
            maxSize = MAX_FILE_SIZES.VIDEO;
          }

          return file.size <= maxSize;
        });
      },
      {
        message: 'One or more files exceed the maximum file size',
      }
    ),
});

// ============================================
// Agent Configuration Schemas
// ============================================

export const updateAgentConfigSchema = z.object({
  modelName: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
  systemPrompt: z.record(z.string(), z.unknown()).optional(),
  additionalParameters: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

// ============================================
// Integration Schemas
// ============================================

export const slackIntegrationSchema = z.object({
  webhookUrl: urlSchema,
  channel: z.string().min(1, 'Slack channel is required'),
  token: z.string().min(1, 'Slack token is required'),
  enabled: z.boolean().default(true),
});

export const emailIntegrationSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.number().min(1).max(65535),
  smtpUser: z.string().min(1, 'SMTP user is required'),
  smtpPassword: z.string().min(1, 'SMTP password is required'),
  fromEmail: emailSchema,
  fromName: z.string().min(1, 'From name is required'),
  enabled: z.boolean().default(true),
});

// ============================================
// Settings Schemas
// ============================================

export const systemSettingsSchema = z.object({
  twoFactorEnabled: z.boolean().optional(),
  timezone: z.string().optional(),
  theme: z.enum(['light', 'dark', 'deloitte', 'futuristic']).optional(),
  language: z.enum(['en-US', 'en-AU', 'en-GB']).optional(),
  dataRetentionDays: z.number().min(1).max(365).optional(),
});

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate data against a schema and return typed result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

/**
 * Get validation error messages as a record
 */
export function getErrorMessages(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.issues.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
}

/**
 * Check if value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Check if value is a valid email
 */
export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

/**
 * Check if value is a valid URL
 */
export function isValidUrl(value: string): boolean {
  return urlSchema.safeParse(value).success;
}

/**
 * Sanitize HTML string to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number, category: 'DOCUMENT' | 'SPREADSHEET' | 'AUDIO' | 'VIDEO'): boolean {
  const maxSize = MAX_FILE_SIZES[category];
  return fileSize <= maxSize;
}

/**
 * Validate file type
 */
export function validateFileType(fileName: string): boolean {
  const extension = `.${fileName.split('.').pop()?.toLowerCase()}`;
  if (!extension || extension === '.') return false;
  
  const allTypes = [
    ...SUPPORTED_FILE_TYPES.DOCUMENTS,
    ...SUPPORTED_FILE_TYPES.SPREADSHEETS,
    ...SUPPORTED_FILE_TYPES.AUDIO,
    ...SUPPORTED_FILE_TYPES.VIDEO,
  ];
  
  return allTypes.includes(extension as any);
}

// Type exports for use in components
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;
export type CreateKnowledgeBaseFormData = z.infer<typeof createKnowledgeBaseSchema>;
export type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;