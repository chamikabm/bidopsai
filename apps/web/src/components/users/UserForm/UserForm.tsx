'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql/client';
import { CREATE_USER, UPDATE_USER } from '@/lib/graphql/mutations/users';
import { UserBasicInfo } from './UserBasicInfo';
import { UserRoleSelector } from './UserRoleSelector';
import { ProfileImageUpload } from './ProfileImageUpload';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const userFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
  profileImageUrl: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  userId?: string;
  initialData?: Partial<UserFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserForm({ userId, initialData, onSuccess, onCancel }: UserFormProps) {
  const [profileImageUrl, setProfileImageUrl] = useState(initialData?.profileImageUrl || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!userId;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: initialData?.email || '',
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      password: '',
      confirmPassword: '',
      roleIds: initialData?.roleIds || [],
      profileImageUrl: initialData?.profileImageUrl || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return graphqlClient.request(CREATE_USER, {
        input: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
          roleIds: data.roleIds,
          profileImageUrl: profileImageUrl || undefined,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User created',
        description: 'The user has been successfully created in Cognito.',
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return graphqlClient.request(UPDATE_USER, {
        id: userId,
        input: {
          firstName: data.firstName,
          lastName: data.lastName,
          profileImageUrl: profileImageUrl || undefined,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      toast({
        title: 'User updated',
        description: 'The user has been successfully updated.',
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Image Upload */}
      <ProfileImageUpload
        value={profileImageUrl}
        onChange={setProfileImageUrl}
      />

      {/* Basic Info */}
      <UserBasicInfo
        form={form}
        isEditing={isEditing}
      />

      {/* Role Selection */}
      <UserRoleSelector
        value={form.watch('roleIds')}
        onChange={(roleIds) => form.setValue('roleIds', roleIds)}
        error={form.formState.errors.roleIds?.message}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
