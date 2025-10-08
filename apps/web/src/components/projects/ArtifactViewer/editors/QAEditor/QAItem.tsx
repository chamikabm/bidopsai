'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';

interface PastAnswer {
  answer: string;
  reference_link?: string;
}

interface QAItemData {
  question: string;
  proposed_answer: string;
  past_answers?: PastAnswer[];
}

interface QAItemProps {
  data: QAItemData;
  index: number;
  onChange: (updatedData: QAItemData) => void;
  isEditable?: boolean;
}

/**
 * QAItem Component
 * 
 * Displays and allows editing of a single Q&A item.
 * Shows the question, proposed answer (editable), and past answers for reference.
 * Past answers are collapsible to save space.
 */
export function QAItem({ data, index, onChange, isEditable = true }: QAItemProps) {
  const [showPastAnswers, setShowPastAnswers] = useState(false);

  const handleProposedAnswerChange = (value: string) => {
    onChange({
      ...data,
      proposed_answer: value,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Badge variant="outline" className="mb-2">
              Question {index + 1}
            </Badge>
            <h4 className="text-sm font-medium leading-relaxed">{data.question}</h4>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Proposed Answer */}
        <div className="space-y-2">
          <Label htmlFor={`answer-${index}`} className="text-sm font-medium">
            Proposed Answer
          </Label>
          <Textarea
            id={`answer-${index}`}
            value={data.proposed_answer}
            onChange={(e) => handleProposedAnswerChange(e.target.value)}
            disabled={!isEditable}
            className="min-h-[120px] resize-y"
            placeholder="Enter the proposed answer..."
          />
        </div>

        {/* Past Answers Section */}
        {data.past_answers && data.past_answers.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPastAnswers(!showPastAnswers)}
                className="w-full justify-between hover:bg-muted/50"
              >
                <span className="text-sm font-medium">
                  Past Answers ({data.past_answers.length})
                </span>
                {showPastAnswers ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showPastAnswers && (
                <div className="space-y-3">
                  {data.past_answers.map((pastAnswer, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Past Answer {idx + 1}
                        </Badge>
                        {pastAnswer.reference_link && (
                          <a
                            href={pastAnswer.reference_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <LinkIcon className="h-3 w-3" />
                            Reference
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {pastAnswer.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}