'use client';

import { Button } from '@/components/ui/button';
import { KnowledgeBaseList } from '@/components/knowledge-bases/KnowledgeBaseList/KnowledgeBaseList';
import { Plus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useKnowledgeBases } from '@/hooks/queries/useKnowledgeBases';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * All Knowledge Bases Page
 *
 * Displays all knowledge bases (both global and local) in a two-section layout.
 * Users can view knowledge bases and create new ones.
 */
export default function AllKnowledgeBasesPage() {
  const router = useRouter();

  // Fetch knowledge bases from GraphQL API
  const { data: knowledgeBases = [], isLoading, error } = useKnowledgeBases();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Bases</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your knowledge bases
          </p>
        </div>
        <Button onClick={() => router.push('/knowledge-bases/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Knowledge Base
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load knowledge bases. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Base List */}
      {!isLoading && !error && <KnowledgeBaseList knowledgeBases={knowledgeBases} />}
    </div>
  );
}