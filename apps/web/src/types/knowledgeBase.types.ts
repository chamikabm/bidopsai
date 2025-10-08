/**
 * Knowledge Base Types
 * 
 * Type definitions for knowledge bases, which can be either global (shared across projects)
 * or local (specific to a single project).
 */

export enum KnowledgeBaseScope {
  GLOBAL = 'GLOBAL',
  LOCAL = 'LOCAL',
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  scope: KnowledgeBaseScope;
  projectId?: string;
  projectName?: string;
  documentCount: number;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  vectorStoreId?: string;
  documents?: KnowledgeBaseDocument[];
}

export interface KnowledgeBaseDocument {
  id: string;
  knowledgeBaseId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  s3Bucket: string;
  s3Key: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  uploadedAt: string;
  metadata?: Record<string, unknown>;
  vectorIds?: string;
}

export interface CreateKnowledgeBaseInput {
  name: string;
  description?: string;
  scope: KnowledgeBaseScope;
  projectId?: string;
}

export interface UpdateKnowledgeBaseInput {
  name?: string;
  description?: string;
}

export interface UploadKnowledgeBaseDocumentInput {
  knowledgeBaseId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  s3Bucket: string;
  s3Key: string;
  metadata?: Record<string, unknown>;
}