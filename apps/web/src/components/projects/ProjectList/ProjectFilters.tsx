/**
 * ProjectFilters Component
 * Filter controls for project list
 */

'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ProjectFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
}

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Waiting', label: 'Waiting' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Failed', label: 'Failed' },
];

export function ProjectFilters({ status, onStatusChange }: ProjectFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id="status-filter" className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
