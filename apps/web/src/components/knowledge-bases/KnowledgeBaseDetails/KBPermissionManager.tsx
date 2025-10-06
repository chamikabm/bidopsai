'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { useSetKnowledgeBasePermission, useRemoveKnowledgeBaseDocument } from '@/hooks/queries/useKnowledgeBases';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import KBPermissionForm from './KBPermissionForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Permission {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  canRead: boolean;
  canWrite: boolean;
}

interface KBPermissionManagerProps {
  knowledgeBaseId: string;
  permissions: Permission[];
}

export default function KBPermissionManager({ knowledgeBaseId, permissions }: KBPermissionManagerProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const setPermission = useSetKnowledgeBasePermission();

  const handleRemovePermission = async (userId: string, userName: string) => {
    try {
      await setPermission.mutateAsync({
        knowledgeBaseId,
        userId,
        canRead: false,
        canWrite: false,
      });
      toast({
        title: 'Success',
        description: `Permission removed for ${userName}`,
      });
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Permissions ({permissions.length})</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add User Permission</DialogTitle>
              </DialogHeader>
              <KBPermissionForm
                knowledgeBaseId={knowledgeBaseId}
                onSuccess={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {permissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No user permissions set</p>
            <p className="text-sm mt-1">Add users to grant them access to this knowledge base</p>
          </div>
        ) : (
          <div className="space-y-2">
            {permissions.map((permission) => (
              <div
                key={permission.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(permission.user.firstName, permission.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {permission.user.firstName} {permission.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{permission.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <Badge variant={permission.canRead ? 'default' : 'outline'} className="gap-1">
                      {permission.canRead ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      Read
                    </Badge>
                    <Badge variant={permission.canWrite ? 'default' : 'outline'} className="gap-1">
                      {permission.canWrite ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      Write
                    </Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Permission</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove access for {permission.user.firstName}{' '}
                          {permission.user.lastName}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleRemovePermission(
                              permission.user.id,
                              `${permission.user.firstName} ${permission.user.lastName}`
                            )
                          }
                          className="bg-destructive text-destructive-foreground"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
