'use client';

import { useState, useCallback } from 'react';
import { QAItem } from './QAItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

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

interface QAEditorProps {
  content: QAContent;
  onChange: (content: QAContent) => void;
  isEditable?: boolean;
}

/**
 * QAEditor Component
 * 
 * Editor for Q&A type artifacts (worddoc/pdf with q_and_a category).
 * Displays a list of questions with proposed answers (editable) and past answers for reference.
 * 
 * Content structure:
 * {
 *   q_and_a: [
 *     {
 *       question: string,
 *       proposed_answer: string,
 *       past_answers: [
 *         { answer: string, reference_link?: string }
 *       ]
 *     }
 *   ]
 * }
 */
export function QAEditor({ content, onChange, isEditable = true }: QAEditorProps) {
  const [qaItems] = useState<QAItemData[]>(content.q_and_a || []);

  const handleItemChange = useCallback(
    (index: number, updatedItem: QAItemData) => {
      const updatedItems = [...qaItems];
      updatedItems[index] = updatedItem;
      onChange({ q_and_a: updatedItems });
    },
    [qaItems, onChange]
  );

  if (!content.q_and_a || content.q_and_a.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No Q&A items found in this artifact. The content may be empty or in an unexpected format.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Header */}
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Edit the proposed answers below. Past answers are shown for reference and context.
          {!isEditable && ' This artifact is read-only.'}
        </AlertDescription>
      </Alert>

      {/* Q&A Items List */}
      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-4 pr-4">
          {qaItems.map((item, index) => (
            <QAItem
              key={index}
              data={item}
              index={index}
              onChange={(updatedItem) => handleItemChange(index, updatedItem)}
              isEditable={isEditable}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <span>Total Questions: {qaItems.length}</span>
        <span>
          Questions with Past Answers:{' '}
          {qaItems.filter((item) => item.past_answers && item.past_answers.length > 0).length}
        </span>
      </div>
    </div>
  );
}