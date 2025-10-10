'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUsers } from '@/hooks/queries/useUsers';
import { useSetKnowledgeBasePermission } from '@/hooks/queries/useKnowledgeBases';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const permissionSchema = z.object({
  userId: z.string().min(1, 'Please select a user'),
  canRead: z.boolean(),
  canWrite: z.boolean(),
}).refine((data) => data.canRead || data.canWrite, {
  message: 'At least one permission (Read or Write) must be granted',
  path: ['canRead'],
});

type PermissionFormData = z.infer<typeof permissionSchema>;

interface KBPermissionFormProps {
  knowledgeBaseId: string;
  onSuccess?: () => void;
}

export default function KBPermissionForm({ knowledgeBaseId, onSuccess }: KBPermissionFormProps) {
  const { toast } = useToast();
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const setPermission = useSetKnowledgeBasePermission();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      userId: '',
      canRead: true,
      canWrite: false,
    },
  });

  const users = usersData?.users || [];

  const onSubmit = async (data: PermissionFormData) => {
    setIsSubmitting(true);
    try {
      await setPermission.mutateAsync({
        knowledgeBaseId,
        userId: data.userId,
        canRead: data.canRead,
        canWrite: data.canWrite,
      });

      toast({
        title: 'Success',
        description: 'Permission added successfully',
      });

      form.reset();
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="userId">User *</Label>
        <Select
          onValueChange={(value) => form.setValue('userId', value)}
          disabled={usersLoading}
        >
          <SelectTrigger id="userId">
            <SelectValue placeholder={usersLoading ? 'Loading users...' : 'Select a user'} />
          </SelectTrigger>
          <SelectContent>
            {users.map((user: any) => (
              <SelectItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.userId && (
          <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label>Permissions *</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="canRead"
              checked={form.watch('canRead')}
              onCheckedChange={(checked) => form.setValue('canRead', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="canRead" className="cursor-pointer font-medium">
                Read Access
              </Label>
              <p className="text-sm text-muted-foreground">
                User can view and search documents in this knowledge base
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="canWrite"
              checked={form.watch('canWrite')}
              onCheckedChange={(checked) => form.setValue('canWrite', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="canWrite" className="cursor-pointer font-medium">
                Write Access
              </Label>
              <p className="text-sm text-muted-foreground">
                User can upload and delete documents in this knowledge base
              </p>
            </div>
          </div>
        </div>
        {form.formState.errors.canRead && (
          <p className="text-sm text-destructive">{form.formState.errors.canRead.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Permission'}
        </Button>
      </div>
    </form>
  );
}
