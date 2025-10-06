'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  status: string;
  roles: Array<{
    id: string;
    name: string;
  }>;
}

interface UserListItemProps {
  user: User;
  onView?: (userId: string) => void;
  onEdit?: (userId: string) => void;
  actions?: React.ReactNode;
}

export function UserListItem({ user, onView, actions }: UserListItemProps) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <tr
      className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => onView?.(user.id)}
    >
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.profileImageUrl} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{fullName}</p>
            <p className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <p className="text-sm">{user.email}</p>
      </td>
      <td className="p-4">
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role.id} variant="secondary">
              {role.name}
            </Badge>
          ))}
        </div>
      </td>
      <td className="p-4">
        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
          {user.status}
        </Badge>
      </td>
      <td className="p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end">{actions}</div>
      </td>
    </tr>
  );
}
