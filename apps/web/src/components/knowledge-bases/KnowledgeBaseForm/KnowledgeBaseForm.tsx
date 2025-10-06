'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateKnowledgeBase } from '@/hooks/queries/useKnowledgeBases';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import KBBasicInfo from './KBBasicInfo';
import KBTypeSelector from './KBTypeSelector';
import KBProjectSelector from './KBProjectSelector';

const knowledgeBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  type: z.enum(['GLOBAL', 'LOCAL'], {
    message: 'Please select a knowledge base type',
  }),
  projectId: z.string().optional(),
}).refine((data) => {
  if (data.type === 'LOCAL' && !data.projectId) {
    return false;
  }
  return true;
}, {
  message: 'Project is required for local knowledge bases',
  path: ['projectId'],
});

type KnowledgeBaseFormData = z.infer<typeof knowledgeBaseSchema>;

interface KnowledgeBaseFormProps {
  onSuccess?: () => void;
}

export default function KnowledgeBaseForm({ onSuccess }: KnowledgeBaseFormProps) {
  const { toast } = useToast();
  const createKB = useCreateKnowledgeBase();
  const { hasPermission } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageGlobal = hasPermission('canManageGlobalKB');
  const canManageLocal = hasPermission('canManageLocalKB');

  const form = useForm<KnowledgeBaseFormData>({
    resolver: zodResolver(knowledgeBaseSchema),
    defaultValues: {
      name: '',
      description: '',
      type: canManageGlobal ? 'GLOBAL' : 'LOCAL',
      projectId: undefined,
    },
  });

  const watchType = form.watch('type');

  const onSubmit = async (data: KnowledgeBaseFormData) => {
    setIsSubmitting(true);
    try {
      const input = {
        name: data.name,
        description: data.description,
        type: data.type,
        ...(data.type === 'LOCAL' && data.projectId ? { projectId: data.projectId } : {}),
      };

      await createKB.mutateAsync(input);
      
      toast({
        title: 'Success',
        description: 'Knowledge base created successfully',
      });

      form.reset();
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Create Knowledge Base</DialogTitle>
      </DialogHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <KBBasicInfo form={form} />
        <KBTypeSelector form={form} canManageGlobal={canManageGlobal} canManageLocal={canManageLocal} />
        {watchType === 'LOCAL' && <KBProjectSelector form={form} />}

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Knowledge Base'}
          </Button>
        </div>
      </form>
    </div>
  );
}
