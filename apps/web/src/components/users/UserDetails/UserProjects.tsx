'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, X, Calendar, Briefcase } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ProjectMember {
  id: string;
  project: {
    id: string;
    name: string;
    status: string;
    deadline?: string;
  };
  role: string;
}

interface UserProjectsProps {
  userId: string;
  projects: ProjectMember[];
  onAddProject?: () => void;
}

export function UserProjects({ userId, projects, onAddProject }: UserProjectsProps) {
  const [projectToRemove, setProjectToRemove] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: async (projectId: string) => {
      // TODO: Implement GraphQL mutation to remove user from project
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      toast({
        title: 'Project removed',
        description: 'User has been removed from the project.',
      });
      setProjectToRemove(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove user from project.',
        variant: 'destructive',
      });
    },
  });

  const handleRemove = () => {
    if (projectToRemove) {
      removeMutation.mutate(projectToRemove);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'on_hold':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Assigned Projects
            </CardTitle>
            {onAddProject && (
              <Button variant="outline" size="sm" onClick={onAddProject}>
                <Plus className="mr-2 h-4 w-4" />
                Add to Project
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{member.project.name}</h4>
                      <Badge variant={getStatusColor(member.project.status)}>
                        {member.project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </span>
                      {member.project.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(member.project.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProjectToRemove(member.project.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No projects assigned yet
              </p>
              {onAddProject && (
                <Button variant="outline" onClick={onAddProject}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Project
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!projectToRemove}
        onOpenChange={(open) => !open && setProjectToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the user from the project. They will no longer have
              access to project resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
