'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Upload, Search, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KBDocumentList } from '@/components/knowledge-bases/KnowledgeBaseDetails/KBDocumentList';
import { KBDocumentUpload } from '@/components/knowledge-bases/KnowledgeBaseDetails/KBDocumentUpload';
import { KnowledgeBaseScope, type KnowledgeBase, type KnowledgeBaseDocument } from '@/types/knowledgeBase.types';
import { formatDate } from '@/utils/date';

export default function KnowledgeBaseDetailPage() {
  const params = useParams();
  const knowledgeBaseId = params.knowledgeBaseId as string;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // TODO: Replace with actual GraphQL query
  const knowledgeBase: KnowledgeBase = {
    id: knowledgeBaseId,
    name: 'Global Technical Standards',
    description: 'Collection of technical standards, best practices, and compliance documents for all projects.',
    scope: KnowledgeBaseScope.GLOBAL,
    documentCount: 24,
    createdBy: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Smith',
    },
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-10-05T14:30:00Z',
    vectorStoreId: 'vs-abc123',
    projectId: undefined,
    projectName: undefined,
  };

  // TODO: Replace with actual GraphQL query filtered by searchQuery
  const documents: KnowledgeBaseDocument[] = [
    {
      id: 'doc-1',
      knowledgeBaseId,
      fileName: 'AWS_Security_Best_Practices.pdf',
      filePath: 's3://bucket/knowledge-bases/global/aws-security.pdf',
      fileType: 'application/pdf',
      fileSize: 2457600,
      s3Bucket: 'bidopsai-documents',
      s3Key: 'knowledge-bases/global/aws-security.pdf',
      uploadedBy: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Smith',
      },
      uploadedAt: '2025-01-20T09:15:00Z',
      metadata: {
        tags: ['security', 'aws', 'compliance'],
      },
      vectorIds: 'vec-001,vec-002,vec-003',
    },
    {
      id: 'doc-2',
      knowledgeBaseId,
      fileName: 'ISO_27001_Compliance_Guide.docx',
      filePath: 's3://bucket/knowledge-bases/global/iso-27001.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 1048576,
      s3Bucket: 'bidopsai-documents',
      s3Key: 'knowledge-bases/global/iso-27001.docx',
      uploadedBy: {
        id: 'user-2',
        firstName: 'Sarah',
        lastName: 'Johnson',
      },
      uploadedAt: '2025-02-10T14:30:00Z',
      metadata: {
        tags: ['compliance', 'iso', 'security'],
      },
      vectorIds: 'vec-004,vec-005',
    },
    {
      id: 'doc-3',
      knowledgeBaseId,
      fileName: 'Technical_Architecture_Patterns.pptx',
      filePath: 's3://bucket/knowledge-bases/global/arch-patterns.pptx',
      fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileSize: 5242880,
      s3Bucket: 'bidopsai-documents',
      s3Key: 'knowledge-bases/global/arch-patterns.pptx',
      uploadedBy: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Smith',
      },
      uploadedAt: '2025-03-05T11:00:00Z',
      metadata: {
        tags: ['architecture', 'patterns', 'design'],
      },
      vectorIds: 'vec-006,vec-007,vec-008,vec-009',
    },
  ];

  const filteredDocuments = searchQuery
    ? documents.filter((doc) =>
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

  const handleDeleteDocument = async (documentId: string) => {
    // TODO: Implement GraphQL mutation to delete document
    console.log('Delete document:', documentId);
  };

  const handleDownloadDocument = async (document: KnowledgeBaseDocument) => {
    // TODO: Implement S3 download via presigned URL
    console.log('Download document:', document.fileName);
  };

  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    // TODO: Refetch documents list
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/knowledge-bases/all">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{knowledgeBase.name}</h1>
            {knowledgeBase.description && (
              <p className="text-muted-foreground mt-1">{knowledgeBase.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </div>

      {/* Knowledge Base Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Information</CardTitle>
          <CardDescription>Details about this knowledge base</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Scope</div>
              <Badge variant={knowledgeBase.scope === KnowledgeBaseScope.GLOBAL ? 'default' : 'secondary'} className="mt-1">
                {knowledgeBase.scope}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Documents</div>
              <div className="text-2xl font-bold mt-1">{knowledgeBase.documentCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created By</div>
              <div className="text-sm font-medium mt-1">
                {knowledgeBase.createdBy.firstName} {knowledgeBase.createdBy.lastName}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-sm font-medium mt-1">
                {formatDate(knowledgeBase.createdAt)}
              </div>
            </div>
            {knowledgeBase.scope === KnowledgeBaseScope.LOCAL && knowledgeBase.projectName && (
              <div>
                <div className="text-sm text-muted-foreground">Project</div>
                <div className="text-sm font-medium mt-1">{knowledgeBase.projectName}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                {filteredDocuments.length} of {documents.length} documents
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length > 0 ? (
            <KBDocumentList
              documents={filteredDocuments}
              onDelete={handleDeleteDocument}
              onDownload={handleDownloadDocument}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No documents found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Upload documents to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <KBDocumentUpload
        knowledgeBaseId={knowledgeBaseId}
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}