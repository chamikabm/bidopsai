'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AI_MODELS } from '@/types/agent';

interface AgentModelSettingsProps {
  form: UseFormReturn<any>;
}

export function AgentModelSettings({ form }: AgentModelSettingsProps) {
  return (
    <FormField
      control={form.control}
      name="modelName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>AI Model</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select an AI model" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Choose the AI model to use for this agent
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
