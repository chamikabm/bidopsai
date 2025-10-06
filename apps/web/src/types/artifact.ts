/**
 * Artifact Type Definitions
 */

export enum ArtifactType {
  WORDDOC = 'WORDDOC',
  PDF = 'PDF',
  PPT = 'PPT',
  EXCEL = 'EXCEL',
}

export enum ArtifactCategory {
  DOCUMENT = 'DOCUMENT',
  Q_AND_A = 'Q_AND_A',
  EXCEL = 'EXCEL',
}

export enum ArtifactStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface ArtifactVersion {
  id: string;
  versionNumber: number;
  content: any; // TipTap JSON or Q&A format
  location?: string;
  createdAt: string;
  createdBy?: User;
}

export interface Artifact {
  id: string;
  projectId: string;
  name: string;
  type: ArtifactType;
  category: ArtifactCategory;
  status: ArtifactStatus;
  createdAt: string;
  approvedAt?: string;
  createdBy?: User;
  approvedBy?: User;
  versions?: ArtifactVersion[];
  latestVersion?: ArtifactVersion;
}

// Q&A specific types
export interface PastAnswer {
  answer: string;
  source: string;
  date: string;
  reference?: string;
}

export interface QAItem {
  id: string;
  question: string;
  proposedAnswer: string;
  pastAnswers?: PastAnswer[];
}

export interface QAContent {
  items: QAItem[];
}
