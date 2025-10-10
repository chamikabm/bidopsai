/**
 * ProjectBasicInfo Component
 * Form fields for basic project information
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ProjectFormData } from './types';

interface ProjectBasicInfoProps {
  register: UseFormRegister<ProjectFormData>;
  errors: FieldErrors<ProjectFormData>;
}

export function ProjectBasicInfo({ register, errors }: ProjectBasicInfoProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Enter project name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter project description"
          rows={4}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline *</Label>
        <Input
          id="deadline"
          type="datetime-local"
          {...register('deadline')}
          className={errors.deadline ? 'border-red-500' : ''}
        />
        {errors.deadline && (
          <p className="text-sm text-red-500">{errors.deadline.message}</p>
        )}
      </div>
    </div>
  );
}
