'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserList } from '@/components/users/UserList/UserList';
import { UserSearch } from '@/components/users/UserList/UserSearch';
import { type User, UserRole } from '@/types/user.types';

export default function AllUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // TODO: Replace with actual GraphQL query
  const users: User[] = [
    {
      id: 'user-1',
      email: 'john.smith@company.com',
      username: 'jsmith',
      firstName: 'John',
      lastName: 'Smith',
      profileImageUrl: undefined,
      preferredLanguage: 'en-US',
      themePreference: 'dark',
      emailVerified: true,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: '2025-10-01T14:30:00Z',
      lastLogin: '2025-10-07T08:15:00Z',
      cognitoUserId: 'cognito-user-1',
      roles: [
        {
          id: 'role-1',
          name: UserRole.ADMIN,
          description: 'Full system access',
          permissions: [],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    },
    {
      id: 'user-2',
      email: 'sarah.johnson@company.com',
      username: 'sjohnson',
      firstName: 'Sarah',
      lastName: 'Johnson',
      profileImageUrl: undefined,
      preferredLanguage: 'en-US',
      themePreference: 'light',
      emailVerified: true,
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-10-05T16:20:00Z',
      lastLogin: '2025-10-07T09:45:00Z',
      cognitoUserId: 'cognito-user-2',
      roles: [
        {
          id: 'role-2',
          name: UserRole.BIDDER,
          description: 'Full access to bidding workflow',
          permissions: [],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    },
    {
      id: 'user-3',
      email: 'mike.chen@company.com',
      username: 'mchen',
      firstName: 'Mike',
      lastName: 'Chen',
      profileImageUrl: undefined,
      preferredLanguage: 'en-US',
      themePreference: 'futuristic',
      emailVerified: true,
      createdAt: '2025-02-01T11:00:00Z',
      updatedAt: '2025-10-06T10:15:00Z',
      lastLogin: '2025-10-07T07:30:00Z',
      cognitoUserId: 'cognito-user-3',
      roles: [
        {
          id: 'role-3',
          name: UserRole.DRAFTER,
          description: 'Access up to QA process',
          permissions: [],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    },
    {
      id: 'user-4',
      email: 'lisa.wong@company.com',
      username: 'lwong',
      firstName: 'Lisa',
      lastName: 'Wong',
      profileImageUrl: undefined,
      preferredLanguage: 'en-AU',
      themePreference: 'light',
      emailVerified: true,
      createdAt: '2025-02-10T14:00:00Z',
      updatedAt: '2025-10-04T12:00:00Z',
      lastLogin: '2025-10-06T15:20:00Z',
      cognitoUserId: 'cognito-user-4',
      roles: [
        {
          id: 'role-4',
          name: UserRole.KB_ADMIN,
          description: 'Full access to knowledge bases',
          permissions: [],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    },
  ];

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'all' ||
      user.roles.some((role) => role.name === roleFilter);

    return matchesSearch && matchesRole;
  });

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

      {/* User List */}
      <UserList users={filteredUsers} />
    </div>
  );
}