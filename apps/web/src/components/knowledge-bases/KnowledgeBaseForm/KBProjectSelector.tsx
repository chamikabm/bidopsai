'use client';

import { UseFormReturn } from 'react-hook-form';
import { useProjects } from '@/hooks/queries/useProjects';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface KBProjectSelectorProps {
  form: UseFormReturn<any>;
}

export default function KBProjectSelector({ form }: KBProjectSelectorProps) {
  const { setValue, formState: { errors } } = form;
  const { data, isLoading } = useProjects();

  const projects = data?.projects || [];

  return (
    <div className="space-y-2">
      <Label htmlFor="projectId">Project *</Label>
      <Select
        onValueChange={(value) => setValue('projectId', value)}
        disabled={isLoading}
      >
        <SelectTrigger id="projectId">
          <SelectValue placeholder={isLoading ? 'Loading projects...' : 'Select a project'} />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project: any) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors.projectId && (
        <p className="text-sm text-destructive">{errors.projectId.message as string}</p>
      )}
    </div>
  );
}
