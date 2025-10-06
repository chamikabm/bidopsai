'use client';

import { useState, useEffect } from 'react';
import { QAContent, QAItem } from '@/types/artifact';
import { QAItemComponent } from './QAItem';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface QAEditorProps {
  content: QAContent;
  onChange: (content: QAContent) => void;
  editable?: boolean;
  className?: string;
}

export function QAEditor({
  content,
  onChange,
  editable = true,
  className,
}: QAEditorProps) {
  const [items, setItems] = useState<QAItem[]>(content.items || []);

  useEffect(() => {
    setItems(content.items || []);
  }, [content]);

  const handleItemChange = (id: string, updatedItem: QAItem) => {
    const newItems = items.map((item) =>
      item.id === id ? updatedItem : item
    );
    setItems(newItems);
    onChange({ items: newItems });
  };

  const handleAddItem = () => {
    const newItem: QAItem = {
      id: `qa-${Date.now()}`,
      question: '',
      proposedAnswer: '',
      pastAnswers: [],
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    onChange({ items: newItems });
  };

  const handleDeleteItem = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    onChange({ items: newItems });
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No questions yet</p>
              {editable && (
                <Button onClick={handleAddItem} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              )}
            </div>
          ) : (
            items.map((item, index) => (
              <QAItemComponent
                key={item.id}
                item={item}
                index={index}
                editable={editable}
                onChange={(updatedItem) => handleItemChange(item.id, updatedItem)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {editable && items.length > 0 && (
        <div className="border-t p-4">
          <Button onClick={handleAddItem} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      )}
    </div>
  );
}
