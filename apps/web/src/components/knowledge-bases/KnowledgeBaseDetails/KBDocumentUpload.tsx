'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileDropzone } from '@/components/common/FileUpload/FileDropzone';

interface KBDocumentUploadProps {
  knowledgeBaseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

export function KBDocumentUpload({
  knowledgeBaseId,
  open,
  onOpenChange,
  onUploadComplete,
}: KBDocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      // TODO: Implement actual upload logic
      // 1. Get presigned URLs from GraphQL mutation
      // 2. Upload files to S3
      // 3. Create KnowledgeBaseDocument records via GraphQL
      console.log('Uploading files to KB:', knowledgeBaseId, files);

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reset state and notify parent
      setFiles([]);
      onUploadComplete();
    } catch (error) {
      console.error('Upload failed:', error);
      // TODO: Show error toast
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (!isUploading) {
      setFiles([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Add documents to this knowledge base. Supported formats: PDF, Word, Excel,
            PowerPoint, audio, and video files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Dropzone */}
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.mp4,.wav,.m4a"
            multiple
            disabled={isUploading}
          />

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Selected Files ({files.length})
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}