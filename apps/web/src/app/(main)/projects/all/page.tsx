/**
 * All Projects Page
 * 
 * List view of all projects with search, filters, and pagination
 */

'use client';

import { useState } from 'react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { useUserProjects } from '@/hooks/queries/useDashboard';
import { ProjectStatus } from '@/types/project.types';

export default function AllProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const itemsPerPage = 12;

  // Fetch projects
  const { data: projectsData, isLoading, error } = useUserProjects({
    first: itemsPerPage,
  });

  // Filter projects based on search and status
  const filteredProjects = projectsData?.edges
    .map((edge) => edge.node)
    .filter((project) => {
      const matchesSearch = searchQuery
        ? project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all your bidding projects
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={ProjectStatus.DRAFT}>Draft</SelectItem>
            <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={ProjectStatus.UNDER_REVIEW}>Under Review</SelectItem>
            <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={ProjectStatus.SUBMITTED}>Submitted</SelectItem>
            <SelectItem value={ProjectStatus.WON}>Won</SelectItem>
            <SelectItem value={ProjectStatus.LOST}>Lost</SelectItem>
            <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      {!isLoading && filteredProjects.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredProjects.length} of {projectsData?.totalCount || 0} projects
        </p>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load projects. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[180px]" />
          ))}
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              status={project.status as ProjectStatus}
              deadline={project.deadline}
              progressPercentage={project.progressPercentage}
              memberCount={project.members?.length}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-6">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">No projects found</h3>
          <p className="mb-6 max-w-md text-muted-foreground">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first project'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}