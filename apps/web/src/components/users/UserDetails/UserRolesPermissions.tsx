'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getPermissionsForRole, UserRole } from '@/types/auth';
import { Shield, Check } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface UserRolesPermissionsProps {
  roles: Role[];
}

export function UserRolesPermissions({ roles }: UserRolesPermissionsProps) {
  // Aggregate all permissions from all roles
  const allPermissions = roles.reduce((acc, role) => {
    const rolePermissions = getPermissionsForRole(role.name as UserRole);
    Object.entries(rolePermissions).forEach(([key, value]) => {
      if (value) {
        acc[key as keyof typeof rolePermissions] = true;
      }
    });
    return acc;
  }, {} as Record<string, boolean>);

  const permissionsList = Object.entries(allPermissions)
    .filter(([_, value]) => value)
    .map(([key]) => ({
      key,
      label: key
        .replace('can', '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Roles & Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Roles */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Assigned Roles</h4>
          {roles.length > 0 ? (
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <Badge variant="default" className="mt-0.5">
                    {role.name}
                  </Badge>
                  <p className="text-sm text-muted-foreground flex-1">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No roles assigned</p>
          )}
        </div>

        <Separator />

        {/* Permissions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Effective Permissions</h4>
          {permissionsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {permissionsList.map((permission) => (
                <div
                  key={permission.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{permission.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No permissions granted</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
