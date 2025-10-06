'use client';

import { ProjectCard } from './ProjectCard';
import { EmptyProjectsState } from './EmptyProjectsState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  deadline?: string;
  progressPercentage: number;
  members?: Array<{
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
}

interface ActiveProjectsListProps {
  projects: Project[];
  isLoading?: boolean;
}

function ProjectCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function ActiveProjectsList({ projects, isLoading = false }: ActiveProjectsListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    );
  }

  if (projects.length === 0) {
    return <EmptyProjectsState />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
