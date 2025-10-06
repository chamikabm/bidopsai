/**
 * DocumentUpload Component
 * Handles file upload with S3 presigned URLs
 */

'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileText, FileSpreadsheet, FileVideo, FileAudio, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUploadItem } from './types';

interface DocumentUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
}

const ACCEPTED_FILE_TYPES = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'audio/*': ['.mp3', '.wav', '.m4a'],
  'video/*': ['.mp4', '.mov', '.avi'],
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function DocumentUpload({ files, onFilesChange, accept }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('word') || fileType.includes('pdf')) {
      return <FileText className="h-5 w-5" />;
    }
    if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <FileSpreadsheet className="h-5 w-5" />;
    }
    if (fileType.includes('video')) {
      return <FileVideo className="h-5 w-5" />;
    }
    if (fileType.includes('audio')) {
      return <FileAudio className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 100MB limit`;
    }
    return null;
  };

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const validFiles: File[] = [];
      const newUploadItems: FileUploadItem[] = [];

      Array.from(newFiles).forEach((file) => {
        const error = validateFile(file);
        if (error) {
          newUploadItems.push({
            file,
            progress: 0,
            status: 'error',
            error,
          });
        } else {
          validFiles.push(file);
          newUploadItems.push({
            file,
            progress: 0,
            status: 'pending',
          });
        }
      });

      setUploadItems((prev) => [...prev, ...newUploadItems]);
      onFilesChange([...files, ...validFiles]);
    },
    [files, onFilesChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      const newUploadItems = uploadItems.filter((_, i) => i !== index);
      onFilesChange(newFiles);
      setUploadItems(newUploadItems);
    },
    [files, uploadItems, onFilesChange]
  );

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={accept || Object.keys(ACCEPTED_FILE_TYPES).join(',')}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-sm">
            <label htmlFor="file-upload" className="font-medium text-primary cursor-pointer hover:underline">
              Click to upload
            </label>
            <span className="text-muted-foreground"> or drag and drop</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Word, Excel, PDF, Audio, Video files (max 100MB each)
          </p>
        </div>
      </div>

      {uploadItems.length > 0 && (
        <div className="space-y-2">
          {uploadItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="text-muted-foreground">
                {getFileIcon(item.file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(item.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {item.status === 'error' && item.error && (
                  <p className="text-xs text-red-500 mt-1">{item.error}</p>
                )}
                {item.status === 'uploading' && (
                  <Progress value={item.progress} className="mt-2 h-1" />
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
