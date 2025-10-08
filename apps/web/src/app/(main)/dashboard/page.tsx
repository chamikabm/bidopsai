/**
 * Dashboard Page
 * 
 * Landing page for authenticated users showing statistics and active projects
 */

'use client';

import { StatsCards } from '@/components/dashboard/StatsCards';
import { ActiveProjectsList } from '@/components/dashboard/ActiveProjectsList';
import { useDashboardStats, useUserProjects } from '@/hooks/queries/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ProjectStatus } from '@/types/project.types';

export default function DashboardPage() {
  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  
  // Fetch user's projects (first 9 for dashboard view)
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useUserProjects({
    first: 9,
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your bidding activities and active projects
        </p>
      </div>

      {/* Statistics Section */}
      <section>
        {statsError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load dashboard statistics. Please try again later.
            </AlertDescription>
          </Alert>
        ) : statsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        ) : (
          <StatsCards
            stats={{
              submittedBids: stats?.submittedBids || 0,
              wonBids: stats?.wonBids || 0,
              totalValue: stats?.wonValue || 0,
              activeProjects: stats?.activeRfps || 0,
            }}
          />
        )}
      </section>

      {/* Active Projects Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Active Projects
          </h2>
          {projectsData && projectsData.totalCount > 9 && (
            <a
              href="/projects"
              className="text-sm text-primary hover:underline"
            >
              View all ({projectsData.totalCount})
            </a>
          )}
        </div>

        {projectsError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load projects. Please try again later.
            </AlertDescription>
          </Alert>
        ) : (
          <ActiveProjectsList
            projects={projectsData?.edges.map((edge) => ({
              id: edge.node.id,
              name: edge.node.name,
              status: edge.node.status as ProjectStatus,
              deadline: edge.node.deadline,
              progressPercentage: edge.node.progressPercentage,
              members: edge.node.members,
            }))}
            isLoading={projectsLoading}
          />
        )}
      </section>
    </div>
  );
}