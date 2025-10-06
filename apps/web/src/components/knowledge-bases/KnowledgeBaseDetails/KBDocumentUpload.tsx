'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { useAddKnowledgeBaseDocument } from '@/hooks/queries/useKnowledgeBases';
import { useToast } from '@/hooks/use-toast';

interface KBDocumentUploadProps {
  knowledgeBaseId: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export default function KBDocumentUpload({ knowledgeBaseId }: KBDocumentUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const addDocument = useAddKnowledgeBaseDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      // In a real implementation, you would:
      // 1. Get presigned URLs from the backend
      // 2. Upload files to S3
      // 3. Add document records to the knowledge base

      for (const file of files) {
        // Simulate S3 upload
        const s3Location = `s3://knowledge-bases/${knowledgeBaseId}/${Date.now()}_${file.name}`;
        
        await addDocument.mutateAsync({
          knowledgeBaseId,
          input: {
            fileName: file.name,
            fileType: file.type,
            s3Location,
          },
        });
      }

      toast({
        title: 'Success',
        description: `${files.length} document(s) uploaded successfully`,
      });

      setFiles([]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-sm text-muted-foreground">Drop the files here...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Drag & drop files here, or click to select</p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, Word, Excel, TXT, Markdown
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-3">Files to Upload ({files.length})</h3>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {files.length} File(s)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
