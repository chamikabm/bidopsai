'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Save, Download, FileText } from 'lucide-react';
import type { ArtifactType, ArtifactCategory } from '@/types/artifact.types';
import { formatDate } from '@/utils/date';

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: {
    id: string;
    name: string;
    type: ArtifactType;
    category: ArtifactCategory;
    status: string;
    createdAt: string;
    createdBy: string;
    tags?: string[];
  };
  children: React.ReactNode;
  onSave?: () => void;
  onDownload?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

/**
 * ArtifactModal Component
 * 
 * Full-screen modal dialog for viewing and editing artifacts.
 * Renders different editors based on artifact type and category.
 * Includes save and download functionality with unsaved changes warning.
 */
export function ArtifactModal({
  isOpen,
  onClose,
  artifact,
  children,
  onSave,
  onDownload,
  isSaving = false,
  hasUnsavedChanges = false,
}: ArtifactModalProps) {
  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirm) return;
    }
    onClose();
  };

  // Get file type icon
  const getFileTypeLabel = () => {
    switch (artifact.type) {
      case 'WORDDOC':
        return 'Word Document';
      case 'PDF':
        return 'PDF Document';
      case 'EXCEL':
        return 'Excel Spreadsheet';
      case 'PPT':
        return 'PowerPoint';
      default:
        return artifact.type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <DialogTitle className="text-xl">{artifact.name}</DialogTitle>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{getFileTypeLabel()}</Badge>
                <span>•</span>
                <span>Created {formatDate(artifact.createdAt)}</span>
                <span>•</span>
                <span>by {artifact.createdBy}</span>
                {artifact.tags && artifact.tags.length > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex gap-1">
                      {artifact.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  disabled={isSaving}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              {onSave && (
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving || !hasUnsavedChanges}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Content Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}