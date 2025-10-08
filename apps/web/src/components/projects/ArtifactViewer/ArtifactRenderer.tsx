'use client';

import { Artifact, ArtifactCategory } from '@/types/artifact.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { QAEditor } from './editors/QAEditor';
import { DocumentEditor } from './editors/DocumentEditor';
import { ExcelTableEditor } from './editors/ExcelEditor';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface PastAnswer {
  answer: string;
  reference_link?: string;
}

interface QAItemData {
  question: string;
  proposed_answer: string;
  past_answers?: PastAnswer[];
}

interface QAContent {
  q_and_a: QAItemData[];
}

interface ArtifactRendererProps {
  artifact: Artifact;
  onContentChange: (content: Record<string, unknown>) => void;
  isEditable?: boolean;
}

/**
 * ArtifactRenderer Component
 * 
 * Routes artifacts to the appropriate editor based on their type and category.
 * 
 * Supported combinations:
 * - WORDDOC/PDF + DOCUMENT → DocumentEditor (TipTap rich text)
 * - WORDDOC/PDF + Q_AND_A → QAEditor (Question & Answer format)
 * - EXCEL + EXCEL → ExcelEditor (Table/spreadsheet) - Future
 * - PPT → Not yet implemented
 */
export function ArtifactRenderer({
  artifact,
  onContentChange,
  isEditable = true,
}: ArtifactRendererProps) {
  const latestVersion = artifact.latestVersion;

  if (!latestVersion || !latestVersion.content) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This artifact has no content. It may be corrupted or still being generated.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Route to appropriate editor based on category
  const renderEditor = () => {
    switch (artifact.category) {
      case ArtifactCategory.DOCUMENT:
        // For DOCUMENT category, we use TipTap rich text editor
        // Content is stored as TipTap JSON format
        return (
          <DocumentEditor
            content={JSON.stringify(latestVersion.content)}
            onSave={(content) => {
              // Parse the JSON string back to object and pass to parent
              onContentChange(JSON.parse(content) as Record<string, unknown>);
            }}
            onClose={() => {
              // No-op for now - parent modal handles closing
              // This could trigger a callback if needed
            }}
          />
        );

      case ArtifactCategory.Q_AND_A:
        // Q&A format with questions, proposed answers, and past answers
        return (
          <QAEditor
            content={latestVersion.content as unknown as QAContent}
            onChange={(content) => onContentChange(content as unknown as Record<string, unknown>)}
            isEditable={isEditable}
          />
        );

      case ArtifactCategory.EXCEL:
        // Excel/table editor for spreadsheet-style data
        return (
          <ExcelTableEditor
            content={latestVersion.content as { headers: string[]; rows: { cells: { value: string }[] }[] }}
            onSave={(content) => {
              onContentChange(content as unknown as Record<string, unknown>);
            }}
            onClose={() => {
              // No-op for now - parent modal handles closing
            }}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unknown artifact category: {artifact.category}
                <br />
                <span className="text-xs">
                  This artifact type is not yet supported.
                </span>
              </AlertDescription>
            </Alert>
          </div>
        );
    }
  };

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      }
    >
      {renderEditor()}
    </Suspense>
  );
}