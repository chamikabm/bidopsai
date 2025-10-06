/**
 * ProjectCard Component
 * Card view for a single project
 */

import { Calendar, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status: string;
    deadline: string;
    progressPercentage: number;
    createdBy: {
      firstName: string;
      lastName: string;
    };
    members?: Array<{
      user: {
        firstName: string;
        lastName: string;
      };
    }>;
  };
}

const statusColors: Record<string, string> = {
  Open: 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  Completed: 'bg-green-500',
  Failed: 'bg-red-500',
  Waiting: 'bg-orange-500',
};

export function ProjectCard({ project }: ProjectCardProps) {
  const deadlineDate = new Date(project.deadline);
  const isOverdue = deadlineDate < new Date() && project.status !== 'Completed';

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{project.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {project.description || 'No description'}
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className={`${statusColors[project.status] || 'bg-gray-500'} text-white`}
          >
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progressPercentage}%</span>
          </div>
          <Progress value={project.progressPercentage} className="h-2" />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
              {deadlineDate.toLocaleDateString()}
            </span>
          </div>
          {project.members && project.members.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{project.members.length} members</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getUserInitials(project.createdBy.firstName, project.createdBy.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {project.createdBy.firstName} {project.createdBy.lastName}
            </span>
          </div>
          <Link href={`/projects/${project.id}`}>
            <Button size="sm" variant="outline">
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
