/**
 * Users Section Layout
 * 
 * Centralized protection for all user management routes.
 * Requires 'canAccessUsers' permission to access any user management page.
 */

'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredPermissions={['canAccessUsers']}>
      {children}
    </ProtectedRoute>
  );
}