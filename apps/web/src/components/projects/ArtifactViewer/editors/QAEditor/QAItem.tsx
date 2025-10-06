'use client';

import { QAItem, PastAnswer } from '@/types/artifact';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface QAItemComponentProps {
  item: QAItem;
  index: number;
  editable: boolean;
  onChange: (item: QAItem) => void;
  onDelete: () => void;
}

export function QAItemComponent({
  item,
  index,
  editable,
  onChange,
  onDelete,
}: QAItemComponentProps) {
  const [showPastAnswers, setShowPastAnswers] = useState(false);

  const handleQuestionChange = (question: string) => {
    onChange({ ...item, question });
  };

  const handleProposedAnswerChange = (proposedAnswer: string) => {
    onChange({ ...item, proposedAnswer });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          {/* Question */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`question-${item.id}`} className="text-sm font-semibold">
                Question {index + 1}
              </Label>
              {editable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {editable ? (
              <Textarea
                id={`question-${item.id}`}
                value={item.question}
                onChange={(e) => handleQuestionChange(e.target.value)}
                placeholder="Enter the question..."
                className="min-h-[80px] resize-none"
              />
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {item.question || 'No question provided'}
              </p>
            )}
          </div>

          {/* Proposed Answer */}
          <div className="space-y-2">
            <Label htmlFor={`answer-${item.id}`} className="text-sm font-semibold">
              Proposed Answer
            </Label>
            {editable ? (
              <Textarea
                id={`answer-${item.id}`}
                value={item.proposedAnswer}
                onChange={(e) => handleProposedAnswerChange(e.target.value)}
                placeholder="Enter the proposed answer..."
                className="min-h-[120px] resize-none"
              />
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {item.proposedAnswer || 'No answer provided'}
              </p>
            )}
          </div>

          {/* Past Answers */}
          {item.pastAnswers && item.pastAnswers.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPastAnswers(!showPastAnswers)}
                className="h-auto p-0 hover:bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold cursor-pointer">
                    Past Answers
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    {item.pastAnswers.length}
                  </Badge>
                  {showPastAnswers ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </Button>

              {showPastAnswers && (
                <div className="space-y-3 pl-4 border-l-2 border-muted">
                  {item.pastAnswers.map((pastAnswer, idx) => (
                    <PastAnswerItem key={idx} pastAnswer={pastAnswer} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function PastAnswerItem({ pastAnswer }: { pastAnswer: PastAnswer }) {
  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{pastAnswer.source}</span>
          <span>•</span>
          <span>{new Date(pastAnswer.date).toLocaleDateString()}</span>
        </div>
        {pastAnswer.reference && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            asChild
          >
            <a
              href={pastAnswer.reference}
              target="_blank"
              rel="noopener noreferrer"
              title="View reference"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
      <p className="text-sm text-foreground/90 whitespace-pre-wrap">
        {pastAnswer.answer}
      </p>
    </div>
  );
}
