/**
 * Active Projects List Component
 *
 * Displays user's active/assigned projects
 */

'use client';

import { ProjectCard } from './ProjectCard';
import { EmptyProjectsState } from './EmptyProjectsState';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectStatus } from '@/types/project.types';

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  deadline?: string;
  progressPercentage: number;
  members?: Array<{ id: string }>;
}

interface ActiveProjectsListProps {
  projects?: Project[];
  isLoading?: boolean;
}

export function ActiveProjectsList({ projects, isLoading }: ActiveProjectsListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[180px]" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!projects || projects.length === 0) {
    return <EmptyProjectsState />;
  }

  // Projects grid
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          name={project.name}
          status={project.status}
          deadline={project.deadline}
          progressPercentage={project.progressPercentage}
          memberCount={project.members?.length}
        />
      ))}
    </div>
  );
}