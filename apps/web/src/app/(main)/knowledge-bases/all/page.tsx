'use client';

import { Button } from '@/components/ui/button';
import { KnowledgeBaseList } from '@/components/knowledge-bases/KnowledgeBaseList/KnowledgeBaseList';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { KnowledgeBase, KnowledgeBaseScope } from '@/types/knowledgeBase.types';

/**
 * All Knowledge Bases Page
 * 
 * Displays all knowledge bases (both global and local) in a two-section layout.
 * Users can view knowledge bases and create new ones.
 * 
 * TODO: Replace mock data with actual GraphQL query using useKnowledgeBases hook
 */
export default function AllKnowledgeBasesPage() {
  const router = useRouter();

  // Mock data - will be replaced with actual GraphQL query
  const mockKnowledgeBases: KnowledgeBase[] = [
    {
      id: '1',
      name: 'Company Policies',
      description: 'Internal company policies and procedures',
      scope: KnowledgeBaseScope.GLOBAL,
      documentCount: 45,
      createdBy: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
      },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
    },
    {
      id: '2',
      name: 'Technical Standards',
      description: 'Technical documentation and coding standards',
      scope: KnowledgeBaseScope.GLOBAL,
      documentCount: 78,
      createdBy: {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-25T11:00:00Z',
    },
    {
      id: '3',
      name: 'Project Alpha Documents',
      description: 'Documentation specific to Project Alpha',
      scope: KnowledgeBaseScope.LOCAL,
      projectId: 'proj-1',
      projectName: 'Project Alpha',
      documentCount: 12,
      createdBy: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
      },
      createdAt: '2024-02-01T14:00:00Z',
      updatedAt: '2024-02-05T16:00:00Z',
    },
  ];

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

      {/* Knowledge Base List */}
      <KnowledgeBaseList knowledgeBases={mockKnowledgeBases} />
    </div>
  );
}