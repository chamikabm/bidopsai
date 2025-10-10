'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Database } from 'lucide-react';
import { format } from 'date-fns';

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
}

interface KBDetailsProps {
  knowledgeBase: KnowledgeBase;
}

export default function KBDetails({ knowledgeBase }: KBDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-2xl">{knowledgeBase.name}</CardTitle>
          <Badge variant={knowledgeBase.type === 'GLOBAL' ? 'default' : 'secondary'}>
            {knowledgeBase.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
          <p className="text-sm">{knowledgeBase.description}</p>
        </div>

        {knowledgeBase.project && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Project</h3>
            <p className="text-sm">{knowledgeBase.project.name}</p>
          </div>
        )}

        {knowledgeBase.bedrockKnowledgeBaseId && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Bedrock Knowledge Base ID
            </h3>
            <p className="text-sm font-mono">{knowledgeBase.bedrockKnowledgeBaseId}</p>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created: {format(new Date(knowledgeBase.createdAt), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Updated: {format(new Date(knowledgeBase.updatedAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
