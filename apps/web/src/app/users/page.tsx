'use client';

import { useState } from 'react';
import { UserList } from '@/components/users/UserList';
import { UserForm } from '@/components/users/UserForm';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function UsersPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleCreateUser = () => {
    setShowCreateDialog(true);
  };

  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
    setShowEditDialog(true);
  };

  const handleViewUser = (userId: string) => {
    // Navigate to user details page
    window.location.href = `/users/${userId}`;
  };

  const handleSuccess = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedUserId(null);
  };

  return (
    <ProtectedRoute requiredPermissions={['canManageUsers']}>
      <div className="container mx-auto py-8">
        <UserList
          onCreateUser={handleCreateUser}
          onEditUser={handleEditUser}
          onViewUser={handleViewUser}
        />

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <UserForm
              onSuccess={handleSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {selectedUserId && (
              <UserForm
                userId={selectedUserId}
                onSuccess={handleSuccess}
                onCancel={() => setShowEditDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
