// Knowledge base scope enum
export enum KnowledgeBaseScope {
  GLOBAL = "GLOBAL",
  LOCAL = "LOCAL",
}

// Knowledge base entity
export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  scope: KnowledgeBaseScope;
  projectId?: string;
  documentCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  vectorStoreId?: string;
  documents: KnowledgeBaseDocument[];
}

// Knowledge base document entity
export interface KnowledgeBaseDocument {
  id: string;
  knowledgeBaseId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  s3Bucket: string;
  s3Key: string;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: Record<string, unknown>;
  vectorIds?: string;
}

// Knowledge base permission entity
export interface KnowledgeBasePermission {
  id: string;
  knowledgeBaseId: string;
  userId?: string;
  roleId?: string;
  permissionType: string;
  grantedAt: string;
}

// Create knowledge base input
export interface CreateKnowledgeBaseInput {
  name: string;
  description?: string;
  scope: KnowledgeBaseScope;
  projectId?: string;
}

// Upload document input
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