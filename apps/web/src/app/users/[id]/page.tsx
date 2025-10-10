'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql/client';
import { GET_USER } from '@/lib/graphql/queries/users';
import { UserProfile } from '@/components/users/UserDetails/UserProfile';
import { UserRolesPermissions } from '@/components/users/UserDetails/UserRolesPermissions';
import { UserProjects } from '@/components/users/UserDetails/UserProjects';
import { UserForm } from '@/components/users/UserForm';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft } from 'lucide-react';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await graphqlClient.request(GET_USER, { id: userId });
      return response.user;
    },
  });

  const handleEditSuccess = () => {
    setShowEditDialog(false);
  };

  if (error) {
    return (
      <ProtectedRoute requiredPermissions={['canManageUsers']}>
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load user details. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={['canManageUsers']}>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/users')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile */}
            <div className="lg:col-span-1 space-y-6">
              <UserProfile
                user={data}
                onEdit={() => setShowEditDialog(true)}
              />
            </div>

            {/* Right Column - Roles & Projects */}
            <div className="lg:col-span-2 space-y-6">
              <UserRolesPermissions roles={data.roles} />
              <UserProjects
                userId={userId}
                projects={data.projects || []}
              />
            </div>
          </div>
        ) : null}

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {data && (
              <UserForm
                userId={userId}
                initialData={{
                  email: data.email,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  roleIds: data.roles.map((r: any) => r.id),
                  profileImageUrl: data.profileImageUrl,
                }}
                onSuccess={handleEditSuccess}
                onCancel={() => setShowEditDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
