/**
 * Lazy-loaded component definitions
 * Import heavy components dynamically to reduce initial bundle size
 */

import { lazy } from 'react';

// Editor components (TipTap is heavy)
export const DocumentEditor = lazy(() =>
  import('@/components/projects/ArtifactViewer/editors/DocumentEditor/DocumentEditor').then(
    (mod) => ({ default: mod.DocumentEditor })
  )
);

export const QAEditor = lazy(() =>
  import('@/components/projects/ArtifactViewer/editors/QAEditor/QAEditor').then(
    (mod) => ({ default: mod.QAEditor })
  )
);

// Agent Chat (SSE and real-time features)
export const AgentChatInterface = lazy(() =>
  import('@/components/projects/AgentChat/AgentChatInterface').then(
    (mod) => ({ default: mod.AgentChatInterface })
  )
);

// Knowledge Base components
export const KnowledgeBaseForm = lazy(() =>
  import('@/components/knowledge-bases/KnowledgeBaseForm').then(
    (mod) => ({ default: mod.KnowledgeBaseForm })
  )
);

export const KnowledgeBaseDetails = lazy(() =>
  import('@/components/knowledge-bases/KnowledgeBaseDetails').then(
    (mod) => ({ default: mod.KBDetails })
  )
);

// Project components
export const ProjectForm = lazy(() =>
  import('@/components/projects/ProjectForm').then(
    (mod) => ({ default: mod.ProjectForm })
  )
);

// User management
export const UserForm = lazy(() =>
  import('@/components/users/UserForm').then(
    (mod) => ({ default: mod.UserForm })
  )
);

export const UserDetails = lazy(() =>
  import('@/components/users/UserDetails').then(
    (mod) => ({ default: mod.UserProfile })
  )
);

// Settings components
export const AgentConfiguration = lazy(() =>
  import('@/components/settings/AgentConfiguration').then(
    (mod) => ({ default: mod.AgentConfigForm })
  )
);

// Chart/visualization components (if added in future)
export const DashboardCharts = lazy(() =>
  Promise.resolve({ default: () => null }) // Placeholder for future charts
);
