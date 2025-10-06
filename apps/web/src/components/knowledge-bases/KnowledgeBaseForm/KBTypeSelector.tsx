'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface KBTypeSelectorProps {
  form: UseFormReturn<any>;
  canManageGlobal: boolean;
  canManageLocal: boolean;
}

export default function KBTypeSelector({ form, canManageGlobal, canManageLocal }: KBTypeSelectorProps) {
  const { setValue, watch, formState: { errors } } = form;
  const selectedType = watch('type');

  return (
    <div className="space-y-3">
      <Label>Knowledge Base Type *</Label>
      <RadioGroup
        value={selectedType}
        onValueChange={(value) => {
          setValue('type', value);
          if (value === 'GLOBAL') {
            setValue('projectId', undefined);
          }
        }}
      >
        {canManageGlobal && (
          <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
            <RadioGroupItem value="GLOBAL" id="global" />
            <div className="flex-1">
              <Label htmlFor="global" className="cursor-pointer font-medium">
                Global Knowledge Base
              </Label>
              <p className="text-sm text-muted-foreground">
                Available across all projects for the entire organization
              </p>
            </div>
          </div>
        )}
        {canManageLocal && (
          <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
            <RadioGroupItem value="LOCAL" id="local" />
            <div className="flex-1">
              <Label htmlFor="local" className="cursor-pointer font-medium">
                Local Knowledge Base
              </Label>
              <p className="text-sm text-muted-foreground">
                Specific to a single project
              </p>
            </div>
          </div>
        )}
      </RadioGroup>
      {errors.type && (
        <p className="text-sm text-destructive">{errors.type.message as string}</p>
      )}
    </div>
  );
}
