'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useKnowledgeBase, useKnowledgeBaseDocuments } from '@/hooks/queries/useKnowledgeBases';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload } from 'lucide-react';
import { KBDetails, KBDocumentList, KBDocumentSearch, KBDocumentUpload, KBPermissionManager } from '@/components/knowledge-bases/KnowledgeBaseDetails';

export default function KnowledgeBaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const { hasPermission } = usePermissions();

  const { data: kbData, isLoading: kbLoading, error: kbError } = useKnowledgeBase(id);
  const { data: docsData, isLoading: docsLoading } = useKnowledgeBaseDocuments(id, searchQuery);

  if (kbLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (kbError || !kbData?.knowledgeBase) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load knowledge base</p>
          <Button onClick={() => router.push('/knowledge-bases')} className="mt-4">
            Back to Knowledge Bases
          </Button>
        </div>
      </div>
    );
  }

  const knowledgeBase = kbData.knowledgeBase;
  const documents = docsData?.knowledgeBaseDocuments || knowledgeBase.documents || [];

  // Check permissions based on KB type
  const canUpload =
    (knowledgeBase.type === 'GLOBAL' && hasPermission('canManageGlobalKB')) ||
    (knowledgeBase.type === 'LOCAL' && hasPermission('canManageLocalKB'));

  const canManagePermissions = hasPermission('canManageGlobalKB') || hasPermission('canManageLocalKB');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/knowledge-bases')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <KBDetails knowledgeBase={knowledgeBase} />

      <Tabs defaultValue="documents" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            {canManagePermissions && <TabsTrigger value="permissions">Permissions</TabsTrigger>}
          </TabsList>
          {!showUpload && canUpload && (
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Documents
            </Button>
          )}
        </div>

        <TabsContent value="documents" className="space-y-4">
          {showUpload && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Upload Documents</h3>
                <Button variant="outline" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
              </div>
              <KBDocumentUpload knowledgeBaseId={id} />
            </div>
          )}

          <KBDocumentSearch onSearch={setSearchQuery} />
          
          {docsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <KBDocumentList knowledgeBaseId={id} documents={documents} />
          )}
        </TabsContent>

        {canManagePermissions && (
          <TabsContent value="permissions">
            <KBPermissionManager
              knowledgeBaseId={id}
              permissions={knowledgeBase.permissions || []}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
