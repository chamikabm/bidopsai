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
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No content available</p>
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
            className="h-[500px]"
          />
        );
      case ArtifactCategory.DOCUMENT:
        return (
          <DocumentEditor
            content={content}
            onChange={handleContentChange}
            editable={editable}
            placeholder="Start writing your document..."
            className="max-h-[500px] overflow-auto"
          />
        );
      case ArtifactCategory.EXCEL:
        return (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <p>Excel editor coming soon</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <p>Unsupported artifact type</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{artifact.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{artifact.type}</Badge>
                <Badge variant="outline">{artifact.category}</Badge>
                {artifact.latestVersion && (
                  <Badge variant="secondary">
                    v{artifact.latestVersion.versionNumber}
                  </Badge>
                )}
                {hasChanges && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    Unsaved changes
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {renderEditor()}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {artifact.createdBy && (
                <span>
                  Created by {artifact.createdBy.firstName} {artifact.createdBy.lastName}
                </span>
              )}
            </div>
            {editable && <DraftVersionManager artifactId={artifact.id} />}
          </div>
          <div className="flex gap-2">
            {editable && hasChanges && (
              <Button variant="outline" onClick={handleResetToOriginal}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Discard Changes
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            {editable && onSave && (
              <Button onClick={handleSave} disabled={!hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
