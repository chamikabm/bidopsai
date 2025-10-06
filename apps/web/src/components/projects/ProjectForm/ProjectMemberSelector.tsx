/**
 * ProjectMemberSelector Component
 * Multi-select for adding users to project
 */

'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUsers } from '@/hooks/queries/useUsers';

interface ProjectMemberSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ProjectMemberSelector({
  selectedIds,
  onSelectionChange,
}: ProjectMemberSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: users, isLoading } = useUsers();

  const selectedUsers = users?.filter((user) => selectedIds.includes(user.id)) || [];

  const toggleUser = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const removeUser = (id: string) => {
    onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} member${selectedIds.length > 1 ? 's' : ''} selected`
              : 'Add team members...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandEmpty>
              {isLoading ? 'Loading...' : 'No users found.'}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {users?.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.firstName} ${user.lastName} ${user.email}`}
                  onSelect={() => toggleUser(user.id)}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedIds.includes(user.id) ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="text-xs">
                      {getUserInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="gap-2">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[10px]">
                  {getUserInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              {user.firstName} {user.lastName}
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
