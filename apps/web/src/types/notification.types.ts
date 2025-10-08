// Notification type enum
export enum NotificationType {
  PROJECT_UPDATE = "PROJECT_UPDATE",
  WORKFLOW_COMPLETE = "WORKFLOW_COMPLETE",
  ARTIFACT_READY = "ARTIFACT_READY",
  SUBMISSION_COMPLETE = "SUBMISSION_COMPLETE",
  MENTION = "MENTION",
  ASSIGNMENT = "ASSIGNMENT",
}

// Notification entity
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
}

// Mark notification input
export interface MarkNotificationReadInput {
  notificationId: string;
}