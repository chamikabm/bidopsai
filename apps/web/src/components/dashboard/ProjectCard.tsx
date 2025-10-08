/**
 * Project Card Component
 * 
 * Displays a single project with its metadata
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { ProjectStatus } from '@/types/project.types';

interface ProjectCardProps {
  id: string;
  name: string;
  status: ProjectStatus;
  deadline?: Date | string;
  progressPercentage: number;
  memberCount?: number;
}

// Status badge color mapping
const statusColors: Record<ProjectStatus, string> = {
  [ProjectStatus.DRAFT]: 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20',
  [ProjectStatus.IN_PROGRESS]: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
  [ProjectStatus.UNDER_REVIEW]: 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20',
  [ProjectStatus.COMPLETED]: 'bg-green-500/10 text-green-500 dark:bg-green-500/20',
  [ProjectStatus.SUBMITTED]: 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20',
  [ProjectStatus.WON]: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20',
  [ProjectStatus.LOST]: 'bg-red-500/10 text-red-500 dark:bg-red-500/20',
  [ProjectStatus.CANCELLED]: 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20',
};

// Format status for display
const formatStatus = (status: ProjectStatus): string => {
  return status.replace(/_/g, ' ');
};

export function ProjectCard({
  id,
  name,
  status,
  deadline,
  progressPercentage,
  memberCount,
}: ProjectCardProps) {
  // Format deadline
  const deadlineDate = deadline ? new Date(deadline) : null;
  const formattedDeadline = deadlineDate
    ? deadlineDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No deadline';

  // Check if deadline is approaching (within 7 days)
  const isDeadlineApproaching = deadlineDate
    ? (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7
    : false;

  return (
    <Link href={`/projects/${id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">{name}</CardTitle>
            <Badge variant="secondary" className={statusColors[status]}>
              {formatStatus(status)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {/* Deadline */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className={isDeadlineApproaching ? 'text-orange-500' : ''}>
                {formattedDeadline}
              </span>
            </div>

            {/* Member Count */}
            {memberCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{memberCount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}