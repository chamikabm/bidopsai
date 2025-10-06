'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useUserActiveProjects } from '@/hooks/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ActiveProjectsList } from '@/components/dashboard/ActiveProjects';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Dashboard Page
 * 
 * Protected route that displays dashboard statistics and active projects
 * Features real-time updates and responsive design
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // Fetch dashboard data with real-time updates
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(user?.id || '');
  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useUserActiveProjects(user?.id || '', 6);

  if (authLoading) {
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

  const handleRefresh = () => {
    refetchStats();
    refetchProjects();
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Welcome back, {user.givenName}!
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={statsLoading || projectsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${(statsLoading || projectsLoading) ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => router.push('/projects/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <StatsCards
          stats={stats || { submittedBids: 0, wonBids: 0, totalValue: 0, activeProjects: 0 }}
          isLoading={statsLoading}
        />

        {/* Active Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Active Projects</h2>
              <p className="text-sm text-muted-foreground">
                Projects you're currently working on
              </p>
            </div>
            {projects && projects.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => router.push('/projects')}
              >
                View All
              </Button>
            )}
          </div>
          <ActiveProjectsList
            projects={projects || []}
            isLoading={projectsLoading}
          />
        </div>

        {/* Quick Info Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your profile details</CardDescription>
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
                {user.emailVerified ? '✓ Yes' : '✗ No'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Your role-based access</CardDescription>
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
