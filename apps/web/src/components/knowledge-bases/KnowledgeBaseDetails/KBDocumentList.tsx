'use client';

import { useState } from 'react';
import { Download, Trash2, FileText, FileSpreadsheet, FileImage, File, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { type KnowledgeBaseDocument } from '@/types/knowledgeBase.types';
import { formatFileSize } from '@/utils/formatting';
import { formatDate } from '@/utils/date';

interface KBDocumentListProps {
  documents: KnowledgeBaseDocument[];
  onDelete: (documentId: string) => void;
  onDownload: (document: KnowledgeBaseDocument) => void;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('word') || fileType.includes('document')) return FileText;
  if (fileType.includes('sheet') || fileType.includes('excel')) return FileSpreadsheet;
  if (fileType.includes('image')) return FileImage;
  return File;
};

const getFileTypeLabel = (fileType: string) => {
  if (fileType.includes('pdf')) return 'PDF';
  if (fileType.includes('word') || fileType.includes('document')) return 'Word';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'Excel';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'PowerPoint';
  if (fileType.includes('image')) return 'Image';
  if (fileType.includes('video')) return 'Video';
  if (fileType.includes('audio')) return 'Audio';
  return 'Document';
};

export function KBDocumentList({ documents, onDelete, onDownload }: KBDocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeBaseDocument | null>(null);

  const handleDeleteClick = (document: KnowledgeBaseDocument) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedDocument) {
      onDelete(selectedDocument.id);
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Type</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => {
              const FileIcon = getFileIcon(document.fileType);
              const fileTypeLabel = getFileTypeLabel(document.fileType);

              return (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{document.fileName}</div>
                      <Badge variant="secondary" className="mt-1">
                        {fileTypeLabel}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                  <TableCell>
                    {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                  </TableCell>
                  <TableCell>{formatDate(document.uploadedAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDownload(document)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(document)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{selectedDocument?.fileName}&quot; from the knowledge base.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}