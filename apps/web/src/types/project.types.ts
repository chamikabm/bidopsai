// Project status enum
export enum ProjectStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  UNDER_REVIEW = "UNDER_REVIEW",
  COMPLETED = "COMPLETED",
  SUBMITTED = "SUBMITTED",
  WON = "WON",
  LOST = "LOST",
  CANCELLED = "CANCELLED",
}

// Project entity
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  value?: number;
  deadline?: string;
  progressPercentage: number;
  createdBy: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  documents: ProjectDocument[];
  members: ProjectMember[];
  knowledgeBases: string[];
  artifacts: string[];
}

// Project document entity
export interface ProjectDocument {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  rawFileLocation: string;
  processedFileLocation?: string;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: Record<string, unknown>;
}

// Project member entity
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  addedById: string;
  joinedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
}

// Create project input
export interface CreateProjectInput {
  name: string;
  description?: string;
  deadline?: string;
  knowledgeBaseIds?: string[];
  userIds?: string[];
}

// Update project input
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  deadline?: string;
  status?: ProjectStatus;
  progressPercentage?: number;
}