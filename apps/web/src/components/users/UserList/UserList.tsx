'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, MoreVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type User, UserRole } from '@/types/user.types';
import { formatDate } from '@/utils/formatting';

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const handleDelete = (userId: string) => {
    setDeleteUserId(userId);
  };

  const confirmDelete = () => {
    if (deleteUserId) {
      // TODO: Implement user deletion via GraphQL mutation
      console.log('Deleting user:', deleteUserId);
      setDeleteUserId(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'default';
      case UserRole.BIDDER:
        return 'secondary';
      case UserRole.DRAFTER:
        return 'outline';
      case UserRole.KB_ADMIN:
        return 'secondary';
      case UserRole.KB_VIEW:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.BIDDER:
        return 'Bidder';
      case UserRole.DRAFTER:
        return 'Drafter';
      case UserRole.KB_ADMIN:
        return 'KB Admin';
      case UserRole.KB_VIEW:
        return 'KB View';
      default:
        return role;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <div className="mx-auto max-w-md space-y-3">
          <h3 className="text-lg font-semibold">No users found</h3>
          <p className="text-sm text-muted-foreground">
            No users match your search criteria. Try adjusting your filters or
            search query.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                {/* User Avatar and Name */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.profileImageUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                      <AvatarFallback>
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.emailVerified ? (
                          <span className="text-green-600">Verified</span>
                        ) : (
                          <span className="text-amber-600">Not Verified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Email */}
                <TableCell>
                  <div className="text-sm">{user.email}</div>
                </TableCell>

                {/* Username */}
                <TableCell>
                  <div className="text-sm font-mono">{user.username}</div>
                </TableCell>

                {/* Roles */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge
                        key={role.id}
                        variant={getRoleBadgeVariant(role.name)}
                      >
                        {getRoleLabel(role.name)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>

                {/* Last Login */}
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/users/${user.id}`}
                          className="flex items-center"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/users/${user.id}/edit`}
                          className="flex items-center"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit User
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(user.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteUserId !== null}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}