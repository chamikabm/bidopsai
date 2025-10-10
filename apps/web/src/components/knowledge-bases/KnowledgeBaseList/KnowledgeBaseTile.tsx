'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDeleteKnowledgeBase } from '@/hooks/queries/useKnowledgeBases';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
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

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  type: 'GLOBAL' | 'LOCAL';
  project?: {
    id: string;
    name: string;
  };
  documents: Array<{
    id: string;
    fileName: string;
    fileType: string;
  }>;
}

interface KnowledgeBaseTileProps {
  knowledgeBase: KnowledgeBase;
}

export default function KnowledgeBaseTile({ knowledgeBase }: KnowledgeBaseTileProps) {
  const router = useRouter();
  const { toast } = useToast();
  const deleteKB = useDeleteKnowledgeBase();
  const { hasPermission } = usePermissions();

  // Determine if user can delete based on KB type
  const canDelete =
    (knowledgeBase.type === 'GLOBAL' && hasPermission('canManageGlobalKB')) ||
    (knowledgeBase.type === 'LOCAL' && hasPermission('canManageLocalKB'));

  const handleView = () => {
    router.push(`/knowledge-bases/${knowledgeBase.id}`);
  };

  const handleDelete = async () => {
    await deleteKB.mutateAsync(knowledgeBase.id);
    toast({
      title: 'Success',
      description: 'Knowledge base deleted successfully',
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{knowledgeBase.name}</CardTitle>
          <Badge variant={knowledgeBase.type === 'GLOBAL' ? 'default' : 'secondary'}>
            {knowledgeBase.type}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{knowledgeBase.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{knowledgeBase.documents.length} documents</span>
        </div>
        {knowledgeBase.project && (
          <div className="mt-2 text-sm text-muted-foreground">
            Project: {knowledgeBase.project.name}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleView} className="flex-1">
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Knowledge Base</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{knowledgeBase.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}
