'use client';

import { useState, useMemo } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserList } from '@/components/users/UserList/UserList';
import { UserSearch } from '@/components/users/UserList/UserSearch';
import { UserRole } from '@/types/user.types';
import { useUsers } from '@/hooks/queries/useUsers';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AllUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Fetch users from GraphQL API
  const { data: users = [], isLoading, error } = useUsers(searchQuery);

  // Filter users based on role
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'all' ||
        user.roles.some((role) => role.name === roleFilter);

      return matchesRole;
    });
  }, [users, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Link href="/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <UserSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load users. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* User List */}
      {!isLoading && !error && <UserList users={filteredUsers} />}
    </div>
  );
}