/**
 * ProjectSearch Component
 * Search bar for filtering projects
 */

'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ProjectSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ProjectSearch({
  value,
  onChange,
  placeholder = 'Search projects...',
}: ProjectSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
