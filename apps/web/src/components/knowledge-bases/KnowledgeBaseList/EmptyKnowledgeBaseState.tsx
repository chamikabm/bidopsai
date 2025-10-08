'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmptyKnowledgeBaseStateProps {
  title?: string;
  description?: string;
  showCreateButton?: boolean;
}

/**
 * EmptyKnowledgeBaseState Component
 * 
 * Displayed when no knowledge bases are found.
 * Shows a friendly message and optional create button.
 */
export function EmptyKnowledgeBaseState({
  title = 'No knowledge bases found',
  description = 'Get started by creating your first knowledge base to store and organize documents.',
  showCreateButton = true,
}: EmptyKnowledgeBaseStateProps) {
  const router = useRouter();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Database className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
          {description}
        </p>
        {showCreateButton && (
          <Button onClick={() => router.push('/knowledge-bases/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Knowledge Base
          </Button>
        )}
      </CardContent>
    </Card>
  );
}