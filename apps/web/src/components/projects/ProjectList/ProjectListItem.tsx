/**
 * ProjectListItem Component
 * Table row view for a single project
 */

import { Calendar, Users, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface ProjectListItemProps {
  project: {
    id: string;
    name: string;
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
  onDelete?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  Open: 'bg-blue-500',
  'In Progress': 'bg-yellow-500',
  Completed: 'bg-green-500',
  Failed: 'bg-red-500',
  Waiting: 'bg-orange-500',
};

export function ProjectListItem({ project, onDelete }: ProjectListItemProps) {
  const deadlineDate = new Date(project.deadline);
  const isOverdue = deadlineDate < new Date() && project.status !== 'Completed';

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="p-4">
        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
          {project.name}
        </Link>
      </td>
      <td className="p-4">
        <Badge
          variant="secondary"
          className={`${statusColors[project.status] || 'bg-gray-500'} text-white`}
        >
          {project.status}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Progress value={project.progressPercentage} className="h-2 w-24" />
          <span className="text-sm text-muted-foreground">{project.progressPercentage}%</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            {deadlineDate.toLocaleDateString()}
          </span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getUserInitials(project.createdBy.firstName, project.createdBy.lastName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">
            {project.createdBy.firstName} {project.createdBy.lastName}
          </span>
        </div>
      </td>
      <td className="p-4">
        {project.members && project.members.length > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{project.members.length}</span>
          </div>
        )}
      </td>
      <td className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(project.id)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
