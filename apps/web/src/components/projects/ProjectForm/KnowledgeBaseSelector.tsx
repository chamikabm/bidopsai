/**
 * KnowledgeBaseSelector Component
 * Multi-select search for knowledge bases
 */

'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeBases } from '@/hooks/queries/useKnowledgeBases';

interface KnowledgeBaseSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function KnowledgeBaseSelector({
  selectedIds,
  onSelectionChange,
}: KnowledgeBaseSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: knowledgeBases, isLoading } = useKnowledgeBases();

  const selectedKBs = knowledgeBases?.filter((kb) => selectedIds.includes(kb.id)) || [];

  const toggleKnowledgeBase = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const removeKnowledgeBase = (id: string) => {
    onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} knowledge base${selectedIds.length > 1 ? 's' : ''} selected`
              : 'Select knowledge bases...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search knowledge bases..." />
            <CommandEmpty>
              {isLoading ? 'Loading...' : 'No knowledge bases found.'}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {knowledgeBases?.map((kb) => (
                <CommandItem
                  key={kb.id}
                  value={kb.name}
                  onSelect={() => toggleKnowledgeBase(kb.id)}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedIds.includes(kb.id) ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{kb.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {kb.type} • {kb.documentCount || 0} documents
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedKBs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedKBs.map((kb) => (
            <Badge key={kb.id} variant="secondary" className="gap-1">
              {kb.name}
              <button
                type="button"
                onClick={() => removeKnowledgeBase(kb.id)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
