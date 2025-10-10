'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useArtifactDraftStore } from '@/store/artifact-draft-store';
import { History, Save, RotateCcw, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface DraftVersionManagerProps {
  artifactId: string;
}

export function DraftVersionManager({ artifactId }: DraftVersionManagerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const {
    saveDraftVersion,
    getDraftVersions,
    restoreDraftVersion,
    deleteDraftVersion,
    clearDraftVersions,
  } = useArtifactDraftStore();

  const versions = getDraftVersions(artifactId);

  const handleSaveVersion = () => {
    saveDraftVersion(artifactId, versionLabel || undefined);
    setVersionLabel('');
    setSaveDialogOpen(false);
    toast({
      title: 'Version saved',
      description: 'Draft version has been saved successfully.',
    });
  };

  const handleRestoreVersion = (versionId: string) => {
    restoreDraftVersion(artifactId, versionId);
    setOpen(false);
    toast({
      title: 'Version restored',
      description: 'Draft has been restored to the selected version.',
    });
  };

  const handleDeleteVersion = () => {
    if (selectedVersionId) {
      deleteDraftVersion(artifactId, selectedVersionId);
      setDeleteDialogOpen(false);
      setSelectedVersionId(null);
      toast({
        title: 'Version deleted',
        description: 'Draft version has been deleted.',
      });
    }
  };

  const handleClearAll = () => {
    clearDraftVersions(artifactId);
    toast({
      title: 'All versions cleared',
      description: 'All draft versions have been cleared.',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            Version History
            {versions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {versions.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Draft Version History</DialogTitle>
            <DialogDescription>
              Manage saved versions of your draft. You can restore or delete previous versions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setSaveDialogOpen(true)}
                size="sm"
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Current Version
              </Button>
              {versions.length > 0 && (
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  size="sm"
                >
                  Clear All
                </Button>
              )}
            </div>

            <ScrollArea className="h-[400px]">
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Clock className="h-12 w-12 mb-4 opacity-50" />
                  <p>No saved versions yet</p>
                  <p className="text-sm">Save a version to track your changes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {version.label && (
                              <span className="font-medium">{version.label}</span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {formatDistanceToNow(version.timestamp, { addSuffix: true })}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {version.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreVersion(version.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVersionId(version.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Version Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Draft Version</DialogTitle>
            <DialogDescription>
              Give this version a label to help you identify it later (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version-label">Version Label</Label>
              <Input
                id="version-label"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="e.g., Before major revision"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveVersion}>
                <Save className="h-4 w-4 mr-2" />
                Save Version
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this version? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVersion}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
