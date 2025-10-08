'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KnowledgeBase, KnowledgeBaseScope } from '@/types/knowledgeBase.types';
import { Database, Globe, Lock, FileText, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface KnowledgeBaseTileProps {
  knowledgeBase: KnowledgeBase;
  onView: (id: string) => void;
}

/**
 * KnowledgeBaseTile Component
 * 
 * Displays a knowledge base as a card/tile with:
 * - Name and description
 * - Scope badge (Global or Local)
 * - Project name (if local)
 * - Document count
 * - Created by and date
 * - View button
 */
export function KnowledgeBaseTile({ knowledgeBase, onView }: KnowledgeBaseTileProps) {
  const isGlobal = knowledgeBase.scope === KnowledgeBaseScope.GLOBAL;

  return (
    <Card className="group hover:shadow-lg transition-all hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <div
              className={cn(
                'rounded-lg p-2 transition-colors',
                isGlobal
                  ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                  : 'bg-muted text-muted-foreground group-hover:bg-primary/20'
              )}
            >
              <Database className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{knowledgeBase.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={isGlobal ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {isGlobal ? (
                    <Globe className="h-3 w-3 mr-1" />
                  ) : (
                    <Lock className="h-3 w-3 mr-1" />
                  )}
                  {knowledgeBase.scope}
                </Badge>
                {!isGlobal && knowledgeBase.projectName && (
                  <span className="text-xs text-muted-foreground truncate">
                    {knowledgeBase.projectName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {knowledgeBase.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {knowledgeBase.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>
              {knowledgeBase.documentCount}{' '}
              {knowledgeBase.documentCount === 1 ? 'document' : 'documents'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate">
              {knowledgeBase.createdBy.firstName} {knowledgeBase.createdBy.lastName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(knowledgeBase.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Button
          onClick={() => onView(knowledgeBase.id)}
          className="w-full"
          variant="outline"
        >
          View Knowledge Base
        </Button>
      </CardFooter>
    </Card>
  );
}