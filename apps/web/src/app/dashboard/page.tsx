'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout';

/**
 * Dashboard Page
 * 
 * Protected route that displays user information
 * Demonstrates authentication and role-based access
 */
export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>Please sign in to access the dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Welcome back, {user.givenName}!</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back!</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">Name:</span>{' '}
                {user.givenName} {user.familyName}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-semibold">Username:</span> {user.username}
              </div>
              <div>
                <span className="font-semibold">Role:</span> {user.role}
              </div>
              <div>
                <span className="font-semibold">Email Verified:</span>{' '}
                {user.emailVerified ? 'Yes' : 'No'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Your role-based permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Full Workflow Access:</span>
                <span className={user.permissions.canAccessFullWorkflow ? 'text-green-600' : 'text-red-600'}>
                  {user.permissions.canAccessFullWorkflow ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Manage Users:</span>
                <span className={user.permissions.canManageUsers ? 'text-green-600' : 'text-red-600'}>
                  {user.permissions.canManageUsers ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Manage Global KB:</span>
                <span className={user.permissions.canManageGlobalKB ? 'text-green-600' : 'text-red-600'}>
                  {user.permissions.canManageGlobalKB ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Manage Local KB:</span>
                <span className={user.permissions.canManageLocalKB ? 'text-green-600' : 'text-red-600'}>
                  {user.permissions.canManageLocalKB ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Access Comms:</span>
                <span className={user.permissions.canAccessComms ? 'text-green-600' : 'text-red-600'}>
                  {user.permissions.canAccessComms ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Access Submission:</span>
                <span className={user.permissions.canAccessSubmission ? 'text-green-600' : 'text-red-600'}>
                  {user.permissions.canAccessSubmission ? '✓' : '✗'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
