import { z } from 'zod';
import { UserRole } from '@/types/user.types';

/**
 * Validation schema for creating a new user
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters'),
  
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),
  
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),
  
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  
  roles: z
    .array(z.nativeEnum(UserRole))
    .min(1, 'At least one role is required')
    .max(5, 'Maximum 5 roles allowed'),
  
  profileImage: z
    .instanceof(File)
    .refine(
      (file) => {
        // Max file size: 5MB
        const maxSize = 5 * 1024 * 1024;
        return file.size <= maxSize;
      },
      { message: 'Profile image must not exceed 5MB' }
    )
    .refine(
      (file) => {
        // Allowed image types
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];
        return allowedTypes.includes(file.type);
      },
      { message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed' }
    )
    .optional()
    .nullable(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);

export type CreateUserFormData = z.infer<typeof createUserSchema>;

/**
 * Validation schema for updating a user
 */
export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters')
    .optional(),
  
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .optional(),
  
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .optional(),
  
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .optional(),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .optional(),
  
  confirmPassword: z
    .string()
    .optional(),
  
  roles: z
    .array(z.nativeEnum(UserRole))
    .min(1, 'At least one role is required')
    .max(5, 'Maximum 5 roles allowed')
    .optional(),
  
  profileImage: z
    .instanceof(File)
    .refine(
      (file) => {
        const maxSize = 5 * 1024 * 1024;
        return file.size <= maxSize;
      },
      { message: 'Profile image must not exceed 5MB' }
    )
    .refine(
      (file) => {
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];
        return allowedTypes.includes(file.type);
      },
      { message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed' }
    )
    .optional()
    .nullable(),
  
  preferredLanguage: z
    .enum(['en-US', 'en-AU', 'en-GB'])
    .optional(),
  
  themePreference: z
    .enum(['light', 'dark', 'deloitte', 'futuristic'])
    .optional(),
}).refine(
  (data) => {
    // Only validate password match if password is provided
    if (data.password && data.confirmPassword) {
      return data.password === data.confirmPassword;
    }
    return true;
  },
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

/**
 * Helper function to get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Admin';
    case UserRole.BIDDER:
      return 'Bidder';
    case UserRole.DRAFTER:
      return 'Drafter';
    case UserRole.KB_ADMIN:
      return 'KB Admin';
    case UserRole.KB_VIEW:
      return 'KB View';
    default:
      return role;
  }
}

/**
 * Helper function to get role description
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Full system access with all permissions';
    case UserRole.BIDDER:
      return 'Full access to bidding workflow including submission';
    case UserRole.DRAFTER:
      return 'Access up to QA process, cannot proceed to Comms and Submission';
    case UserRole.KB_ADMIN:
      return 'Full access to knowledge bases (local and global) with CRUD permissions';
    case UserRole.KB_VIEW:
      return 'Read-only access to knowledge bases (local and global)';
    default:
      return '';
  }
}