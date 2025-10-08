'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Mail, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { type User, UserRole } from '@/types/user.types';
import { formatDate } from '@/utils/formatting';
import { toast } from 'sonner';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // TODO: Replace with actual GraphQL query
  const user: User = {
    id: userId,
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
  };

  // TODO: Replace with actual assigned projects query
  const assignedProjects = [
    {
      id: 'project-1',
      name: 'AI Implementation RFP 2025',
      status: 'IN_PROGRESS',
      deadline: '2025-12-31T00:00:00Z',
    },
    {
      id: 'project-2',
      name: 'Cloud Migration Proposal',
      status: 'DRAFT',
      deadline: '2025-11-30T00:00:00Z',
    },
  ];

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // TODO: Implement user deletion via GraphQL mutation
      console.log('Deleting user:', userId);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success('User deleted successfully');
      router.push('/users/all');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'default';
      case 'DRAFT':
        return 'secondary';
      case 'COMPLETED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/users/all">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
            <p className="text-muted-foreground mt-1">
              View and manage user information
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/users/${userId}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - User Profile */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage
                    src={user.profileImageUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                  <AvatarFallback className="text-4xl">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {user.roles.map((role) => (
                    <Badge
                      key={role.id}
                      variant={getRoleBadgeVariant(role.name)}
                    >
                      {getRoleLabel(role.name)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.emailVerified && (
                    <Badge variant="outline" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Joined</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Last Login</p>
                  <p className="text-sm text-muted-foreground">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Cognito User ID</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {user.cognitoUserId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Roles & Projects */}
        <div className="md:col-span-2 space-y-6">
          {/* Roles & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                User roles and their associated permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.roles.map((role) => (
                  <div
                    key={role.id}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(role.name)}>
                          {getRoleLabel(role.name)}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Assigned {formatDate(role.createdAt)}
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assigned Projects</CardTitle>
                  <CardDescription>
                    Projects this user has access to
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  Add to Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assignedProjects.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No projects assigned yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block"
                    >
                      <div className="rounded-lg border p-4 hover:bg-accent transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Deadline: {formatDate(project.deadline)}
                            </p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>User preferences and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-sm text-muted-foreground">
                    {user.preferredLanguage || 'en-US'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {user.themePreference || 'System'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account for <strong>{user.firstName} {user.lastName}</strong> and
              remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}