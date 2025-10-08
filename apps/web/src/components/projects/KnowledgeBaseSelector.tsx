/**
 * Knowledge Base Selector Component
 * 
 * Multi-select component for selecting knowledge bases
 */

'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeBases } from '@/hooks/queries/useKnowledgeBases';
import { cn } from '@/lib/utils';

interface KnowledgeBaseSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function KnowledgeBaseSelector({
  selectedIds,
  onChange,
  disabled = false,
}: KnowledgeBaseSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: knowledgeBases = [], isLoading } = useKnowledgeBases();

  const selectedKBs = knowledgeBases.filter((kb) =>
    selectedIds.includes(kb.id)
  );

  const toggleKB = (kbId: string) => {
    const newSelection = selectedIds.includes(kbId)
      ? selectedIds.filter((id) => id !== kbId)
      : [...selectedIds, kbId];
    onChange(newSelection);
  };

  const removeKB = (kbId: string) => {
    onChange(selectedIds.filter((id) => id !== kbId));
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
            disabled={disabled || isLoading}
          >
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {selectedIds.length === 0
                ? 'Select knowledge bases...'
                : `${selectedIds.length} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search knowledge bases..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading...' : 'No knowledge bases found.'}
              </CommandEmpty>
              <CommandGroup>
                {knowledgeBases.map((kb) => (
                  <CommandItem
                    key={kb.id}
                    value={kb.id}
                    onSelect={() => toggleKB(kb.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedIds.includes(kb.id)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{kb.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {kb.scope === 'GLOBAL' ? 'Global' : 'Local'} •{' '}
                        {kb.documentCount} documents
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Knowledge Bases */}
      {selectedKBs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedKBs.map((kb) => (
            <Badge
              key={kb.id}
              variant="secondary"
              className="gap-1"
            >
              <Database className="h-3 w-3" />
              {kb.name}
              <button
                type="button"
                onClick={() => removeKB(kb.id)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <span className="sr-only">Remove</span>
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}