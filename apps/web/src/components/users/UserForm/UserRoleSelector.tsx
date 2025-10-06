'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UserRole, getPermissionsForRole } from '@/types/auth';

interface UserRoleSelectorProps {
  value: string[];
  onChange: (roleIds: string[]) => void;
  error?: string;
}

// Mock role data - in production, this would come from GraphQL
const AVAILABLE_ROLES = [
  {
    id: 'role-admin',
    name: UserRole.ADMIN,
    description: 'Full access to all features and operations',
  },
  {
    id: 'role-bidder',
    name: UserRole.BIDDER,
    description: 'Access to full agentic flow and local knowledge bases',
  },
  {
    id: 'role-drafter',
    name: UserRole.DRAFTER,
    description: 'Access through QA process only',
  },
  {
    id: 'role-kb-admin',
    name: UserRole.KB_ADMIN,
    description: 'Full access to knowledge bases',
  },
  {
    id: 'role-kb-view',
    name: UserRole.KB_VIEW,
    description: 'Read-only access to knowledge bases',
  },
];

export function UserRoleSelector({ value, onChange, error }: UserRoleSelectorProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(value);

  useEffect(() => {
    setSelectedRoles(value);
  }, [value]);

  const handleRoleToggle = (roleId: string) => {
    const newRoles = selectedRoles.includes(roleId)
      ? selectedRoles.filter((id) => id !== roleId)
      : [...selectedRoles, roleId];
    
    setSelectedRoles(newRoles);
    onChange(newRoles);
  };

  const getPermissionsList = (roleName: string) => {
    const permissions = getPermissionsForRole(roleName as UserRole);
    return Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key]) => key.replace('can', '').replace(/([A-Z])/g, ' $1').trim());
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Roles</Label>
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>

      <div className="space-y-3">
        {AVAILABLE_ROLES.map((role) => {
          const isSelected = selectedRoles.includes(role.id);
          const permissions = getPermissionsList(role.name);

          return (
            <div
              key={role.id}
              className={`border rounded-lg p-4 transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={role.id}
                  checked={isSelected}
                  onCheckedChange={() => handleRoleToggle(role.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={role.id} className="font-semibold cursor-pointer">
                      {role.name}
                    </Label>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  {isSelected && permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
