'use client';

import { KnowledgeBase, KnowledgeBaseScope } from '@/types/knowledgeBase.types';
import { KnowledgeBaseTile } from './KnowledgeBaseTile';
import { EmptyKnowledgeBaseState } from './EmptyKnowledgeBaseState';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

interface KnowledgeBaseListProps {
  knowledgeBases: KnowledgeBase[];
}

/**
 * KnowledgeBaseList Component
 * 
 * Displays knowledge bases in two sections:
 * 1. Global Knowledge Bases - Shared across all projects
 * 2. Local Knowledge Bases - Project-specific
 * 
 * Each section shows a grid of knowledge base tiles.
 * If a section is empty, it shows an empty state.
 */
export function KnowledgeBaseList({ knowledgeBases }: KnowledgeBaseListProps) {
  const router = useRouter();

  // Separate global and local knowledge bases
  const globalKBs = knowledgeBases.filter((kb) => kb.scope === KnowledgeBaseScope.GLOBAL);
  const localKBs = knowledgeBases.filter((kb) => kb.scope === KnowledgeBaseScope.LOCAL);

  const handleViewKB = (id: string) => {
    router.push(`/knowledge-bases/${id}`);
  };

  return (
    <div className="space-y-8">
      {/* Global Knowledge Bases Section */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Global Knowledge Bases</h2>
          <p className="text-sm text-muted-foreground">
            Shared knowledge bases accessible across all projects
          </p>
        </div>

        {globalKBs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalKBs.map((kb) => (
              <KnowledgeBaseTile key={kb.id} knowledgeBase={kb} onView={handleViewKB} />
            ))}
          </div>
        ) : (
          <EmptyKnowledgeBaseState
            title="No global knowledge bases"
            description="Global knowledge bases are shared across all projects and can be accessed by anyone with the appropriate permissions."
            showCreateButton={true}
          />
        )}
      </section>

      <Separator />

      {/* Local Knowledge Bases Section */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Local Knowledge Bases</h2>
          <p className="text-sm text-muted-foreground">
            Project-specific knowledge bases
          </p>
        </div>

        {localKBs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localKBs.map((kb) => (
              <KnowledgeBaseTile key={kb.id} knowledgeBase={kb} onView={handleViewKB} />
            ))}
          </div>
        ) : (
          <EmptyKnowledgeBaseState
            title="No local knowledge bases"
            description="Local knowledge bases are specific to individual projects and contain project-related documents."
            showCreateButton={true}
          />
        )}
      </section>
    </div>
  );
}