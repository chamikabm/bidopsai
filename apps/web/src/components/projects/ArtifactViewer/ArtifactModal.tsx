'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Artifact, ArtifactCategory } from '@/types/artifact';
import { DocumentEditor } from './editors/DocumentEditor/DocumentEditor';
import { QAEditor } from './editors/QAEditor/QAEditor';
import { useArtifactDraftStore } from '@/store/artifact-draft-store';
import { Save, X, FileText, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DraftVersionManager } from './DraftVersionManager';

interface ArtifactModalProps {
  artifact: Artifact | null;
  open: boolean;
  onClose: () => void;
  onSave?: (artifactId: string, content: unknown) => void;
  editable?: boolean;
}

export function ArtifactModal({
  artifact,
  open,
  onClose,
  onSave,
  editable = true,
}: ArtifactModalProps) {
  const { toast } = useToast();
  const { getDraft, setDraft, clearDraft, resetToOriginal } = useArtifactDraftStore();
  const [content, setContent] = useState<unknown>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (artifact && open) {
      // Check for draft first
      const draft = getDraft(artifact.id);
      if (draft) {
        setContent(draft.content);
        setHasChanges(true);
      } else if (artifact.latestVersion?.content) {
        setContent(artifact.latestVersion.content);
        setHasChanges(false);
      }
    }
  }, [artifact, open, getDraft]);

  const handleContentChange = (newContent: unknown) => {
    setContent(newContent);
    setHasChanges(true);
    
    // Auto-save to draft store
    if (artifact) {
      setDraft(artifact.id, newContent, artifact.latestVersion?.versionNumber);
    }
  };

  const handleResetToOriginal = () => {
    if (artifact) {
      resetToOriginal(artifact.id);
      const draft = getDraft(artifact.id);
      if (draft) {
        setContent(draft.content);
        setHasChanges(false);
      }
      toast({
        title: 'Changes discarded',
        description: 'Your changes have been discarded and the original content restored.',
      });
    }
  };

  const handleSave = () => {
    if (artifact && onSave && content) {
      onSave(artifact.id, content);
      setHasChanges(false);
      clearDraft(artifact.id);
      toast({
        title: 'Changes saved',
        description: 'Your changes have been saved successfully.',
      });
    }
  };

  const handleClose = () => {
    if (hasChanges && editable) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Your changes are saved as a draft. Do you want to close?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  if (!artifact) return null;

  const renderEditor = () => {
    if (!content) {
      return (
        <div className="flex items-center justify-center h-[300px] md:h-[400px] text-muted-foreground">
          <div className="text-center">
            <FileText className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm md:text-base">No content available</p>
          </div>
        </div>
      );
    }

    switch (artifact.category) {
      case ArtifactCategory.Q_AND_A:
        return (
          <QAEditor
            content={content as { items: Array<{ id: string; question: string; proposedAnswer: string; pastAnswers?: Array<{ answer: string; source: string; date: string; reference?: string }> }> }}
            onChange={handleContentChange}
            editable={editable}
            className="h-[400px] md:h-[500px]"
          />
        );
      case ArtifactCategory.DOCUMENT:
        return (
          <DocumentEditor
            content={content}
            onChange={handleContentChange}
            editable={editable}
            placeholder="Start writing your document..."
            className="max-h-[400px] md:max-h-[500px] overflow-auto"
          />
        );
      case ArtifactCategory.EXCEL:
        return (
          <div className="flex items-center justify-center h-[300px] md:h-[400px] text-muted-foreground">
            <div className="text-center">
              <p className="text-sm md:text-base">Excel editor coming soon</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-[300px] md:h-[400px] text-muted-foreground">
            <p className="text-sm md:text-base">Unsupported artifact type</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col w-[95vw] md:w-full p-4 md:p-6">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg md:text-xl truncate">{artifact.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-1 md:gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{artifact.type}</Badge>
                <Badge variant="outline" className="text-xs">{artifact.category}</Badge>
                {artifact.latestVersion && (
                  <Badge variant="secondary" className="text-xs">
                    v{artifact.latestVersion.versionNumber}
                  </Badge>
                )}
                {hasChanges && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                    Unsaved
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {renderEditor()}
        </div>

        <DialogFooter className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground order-2 md:order-1">
            {artifact.createdBy && (
              <span className="hidden md:inline">
                Created by {artifact.createdBy.firstName} {artifact.createdBy.lastName}
              </span>
            )}
            {editable && <DraftVersionManager artifactId={artifact.id} />}
          </div>
          <div className="flex flex-col md:flex-row gap-2 order-1 md:order-2">
            {editable && hasChanges && (
              <Button variant="outline" onClick={handleResetToOriginal} className="w-full md:w-auto">
                <RotateCcw className="h-4 w-4 mr-2" />
                <span className="md:inline">Discard</span>
              </Button>
            )}
            <Button variant="outline" onClick={handleClose} className="w-full md:w-auto">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            {editable && onSave && (
              <Button onClick={handleSave} disabled={!hasChanges} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
