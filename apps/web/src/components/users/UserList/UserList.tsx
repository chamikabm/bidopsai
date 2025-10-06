'use client';

import { useState } from 'react';
import { useUsers } from '@/hooks/queries/useUsers';
import { UserListItem } from './UserListItem';
import { UserSearch } from './UserSearch';
import { UserQuickActions } from './UserQuickActions';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus } from 'lucide-react';

interface UserListProps {
  onCreateUser?: () => void;
  onEditUser?: (userId: string) => void;
  onViewUser?: (userId: string) => void;
}

export function UserList({ onCreateUser, onEditUser, onViewUser }: UserListProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useUsers({
    limit,
    offset: page * limit,
    search: search || undefined,
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load users. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        {onCreateUser && (
          <Button onClick={onCreateUser}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {/* Search */}
      <UserSearch value={search} onChange={setSearch} />

      {/* User List */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-8 w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : data?.users && data.users.length > 0 ? (
                data.users.map((user) => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    onView={onViewUser}
                    onEdit={onEditUser}
                    actions={
                      <UserQuickActions
                        userId={user.id}
                        onView={onViewUser}
                        onEdit={onEditUser}
                      />
                    }
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {search ? 'No users found matching your search.' : 'No users yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data?.users && data.users.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.users.length)} users
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={data.users.length < limit}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
