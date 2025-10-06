'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Plus } from 'lucide-react';

interface EmptyKnowledgeBaseStateProps {
  onCreateClick: () => void;
}

export default function EmptyKnowledgeBaseState({ onCreateClick }: EmptyKnowledgeBaseStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Database className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No Knowledge Bases Yet</h3>
            <p className="text-muted-foreground">
              Create your first knowledge base to store and organize documents for AI-powered bid preparation.
            </p>
          </div>
          <Button onClick={onCreateClick} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Create Knowledge Base
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
