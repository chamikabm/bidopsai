'use client';

import { useState } from 'react';
import { useKnowledgeBases } from '@/hooks/queries/useKnowledgeBases';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Lock } from 'lucide-react';
import KnowledgeBaseTile from './KnowledgeBaseTile';
import EmptyKnowledgeBaseState from './EmptyKnowledgeBaseState';
import KnowledgeBaseForm from '../KnowledgeBaseForm/KnowledgeBaseForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  type: 'GLOBAL' | 'LOCAL';
  bedrockKnowledgeBaseId?: string;
  createdAt: string;
  updatedAt: string;
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

export default function KnowledgeBaseList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data, isLoading, error } = useKnowledgeBases();
  const { hasPermission, hasAnyPermission } = usePermissions();

  // Check if user has any KB access
  const canViewKB = hasAnyPermission(['canViewKB', 'canManageLocalKB', 'canManageGlobalKB']);
  const canCreateKB = hasAnyPermission(['canManageLocalKB', 'canManageGlobalKB']);

  const knowledgeBases = data?.knowledgeBases || [];
  const globalKBs = knowledgeBases.filter((kb: KnowledgeBase) => kb.type === 'GLOBAL');
  const localKBs = knowledgeBases.filter((kb: KnowledgeBase) => kb.type === 'LOCAL');

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load knowledge bases</p>
      </div>
    );
  }

  if (!canViewKB) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to view knowledge bases. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (knowledgeBases.length === 0) {
    return (
      <>
        <EmptyKnowledgeBaseState onCreateClick={() => setIsCreateDialogOpen(true)} />
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <KnowledgeBaseForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Knowledge Bases</h1>
        {canCreateKB && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Knowledge Base
          </Button>
        )}
      </div>

      {/* Global Knowledge Bases */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Global Knowledge Bases</h2>
        {globalKBs.length === 0 ? (
          <p className="text-muted-foreground">No global knowledge bases yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalKBs.map((kb: KnowledgeBase) => (
              <KnowledgeBaseTile key={kb.id} knowledgeBase={kb} />
            ))}
          </div>
        )}
      </section>

      {/* Local Knowledge Bases */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Local Knowledge Bases</h2>
        {localKBs.length === 0 ? (
          <p className="text-muted-foreground">No local knowledge bases yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localKBs.map((kb: KnowledgeBase) => (
              <KnowledgeBaseTile key={kb.id} knowledgeBase={kb} />
            ))}
          </div>
        )}
      </section>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <KnowledgeBaseForm onSuccess={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
