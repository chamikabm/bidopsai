'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserRole } from '@/types/user.types';

interface UserSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: UserRole | 'all';
  onRoleFilterChange: (role: UserRole | 'all') => void;
}

export function UserSearch({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: UserSearchProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users by name, email, or username..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Role Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Role:</span>
        <Select
          value={roleFilter}
          onValueChange={(value) =>
            onRoleFilterChange(value as UserRole | 'all')
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
            <SelectItem value={UserRole.BIDDER}>Bidder</SelectItem>
            <SelectItem value={UserRole.DRAFTER}>Drafter</SelectItem>
            <SelectItem value={UserRole.KB_ADMIN}>KB Admin</SelectItem>
            <SelectItem value={UserRole.KB_VIEW}>KB View</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}