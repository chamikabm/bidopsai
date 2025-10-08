// Artifact type enum
export enum ArtifactType {
  WORDDOC = "WORDDOC",
  PDF = "PDF",
  PPT = "PPT",
  EXCEL = "EXCEL",
}

// Artifact category enum
export enum ArtifactCategory {
  DOCUMENT = "DOCUMENT",
  Q_AND_A = "Q_AND_A",
  EXCEL = "EXCEL",
}

// Artifact status enum
export enum ArtifactStatus {
  DRAFT = "DRAFT",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// Artifact entity
export interface Artifact {
  id: string;
  projectId: string;
  name: string;
  type: ArtifactType;
  category: ArtifactCategory;
  status: ArtifactStatus;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
  versions: ArtifactVersion[];
  latestVersion?: ArtifactVersion;
}

// Artifact version entity
export interface ArtifactVersion {
  id: string;
  artifactId: string;
  versionNumber: number;
  content: Record<string, unknown>;
  location?: string;
  createdBy: string;
  createdAt: string;
}

// Q&A content structure
export interface QAContent {
  q_and_a: QAItem[];
}

export interface QAItem {
  question: string;
  proposed_answer: string;
  past_answers: PastAnswer[];
}

export interface PastAnswer {
  answer: string;
  reference_link?: string;
}

// TipTap document content structure
export interface TipTapDocument {
  type: "doc";
  content: TipTapNode[];
}

export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
}

export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

// Artifact metadata
export interface ArtifactMetadata {
  created_at: string;
  last_modified_at: string;
  created_by: string;
  updated_by: string;
}

// Artifact with complete structure (as received from agents)
export interface AgentArtifact {
  type: ArtifactType;
  category: ArtifactCategory;
  title: string;
  meta_data: ArtifactMetadata;
  tags: string[];
  content: TipTapDocument | QAContent | Record<string, unknown>;
}