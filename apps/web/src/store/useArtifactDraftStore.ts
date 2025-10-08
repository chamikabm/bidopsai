/**
 * Artifact Draft Store
 * 
 * Manages unsaved artifact edits in memory before sending to agents
 * Allows users to edit multiple artifacts and save all changes at once
 */

import { create } from 'zustand';
import { TipTapDocument, QAContent } from '@/types/artifact.types';

// ============================================
// Types
// ============================================

export interface ArtifactDraft {
  artifactId: string;
  content: TipTapDocument | QAContent | unknown;
  originalContent: TipTapDocument | QAContent | unknown;
  lastModified: Date;
  isDirty: boolean;
}

export interface ArtifactDraftState {
  // Drafts map (artifactId -> draft)
  drafts: Map<string, ArtifactDraft>;
  
  // Get draft by artifact ID
  getDraft: (artifactId: string) => ArtifactDraft | undefined;
  
  // Set draft content
  setDraft: (artifactId: string, content: TipTapDocument | QAContent | unknown, originalContent?: TipTapDocument | QAContent | unknown) => void;
  
  // Update draft content
  updateDraft: (artifactId: string, content: TipTapDocument | QAContent | unknown) => void;
  
  // Remove draft
  removeDraft: (artifactId: string) => void;
  
  // Clear all drafts
  clearAllDrafts: () => void;
  
  // Check if artifact has unsaved changes
  hasUnsavedChanges: (artifactId: string) => boolean;
  
  // Check if any drafts have unsaved changes
  hasAnyUnsavedChanges: () => boolean;
  
  // Get all dirty drafts
  getDirtyDrafts: () => ArtifactDraft[];
  
  // Get draft count
  getDraftCount: () => number;
  
  // Save draft (mark as clean)
  saveDraft: (artifactId: string) => void;
  
  // Save all drafts (mark all as clean)
  saveAllDrafts: () => void;
  
  // Discard draft (revert to original)
  discardDraft: (artifactId: string) => void;
  
  // Discard all drafts
  discardAllDrafts: () => void;
}

// ============================================
// Store
// ============================================

export const useArtifactDraftStore = create<ArtifactDraftState>((set, get) => ({
  drafts: new Map(),
  
  getDraft: (artifactId) => {
    return get().drafts.get(artifactId);
  },
  
  setDraft: (artifactId, content, originalContent) => {
    set((state) => {
      const newDrafts = new Map(state.drafts);
      const original = originalContent || content;
      
      newDrafts.set(artifactId, {
        artifactId,
        content,
        originalContent: original,
        lastModified: new Date(),
        isDirty: false, // New draft starts clean
      });
      
      return { drafts: newDrafts };
    });
  },
  
  updateDraft: (artifactId, content) => {
    set((state) => {
      const newDrafts = new Map(state.drafts);
      const existingDraft = newDrafts.get(artifactId);
      
      if (!existingDraft) {
        // If no draft exists, create one with content as both current and original
        newDrafts.set(artifactId, {
          artifactId,
          content,
          originalContent: content,
          lastModified: new Date(),
          isDirty: false,
        });
      } else {
        // Update existing draft
        newDrafts.set(artifactId, {
          ...existingDraft,
          content,
          lastModified: new Date(),
          isDirty: true, // Mark as dirty since content changed
        });
      }
      
      return { drafts: newDrafts };
    });
  },
  
  removeDraft: (artifactId) => {
    set((state) => {
      const newDrafts = new Map(state.drafts);
      newDrafts.delete(artifactId);
      return { drafts: newDrafts };
    });
  },
  
  clearAllDrafts: () => {
    set({ drafts: new Map() });
  },
  
  hasUnsavedChanges: (artifactId) => {
    const draft = get().drafts.get(artifactId);
    return draft?.isDirty || false;
  },
  
  hasAnyUnsavedChanges: () => {
    return Array.from(get().drafts.values()).some((draft) => draft.isDirty);
  },
  
  getDirtyDrafts: () => {
    return Array.from(get().drafts.values()).filter((draft) => draft.isDirty);
  },
  
  getDraftCount: () => {
    return get().drafts.size;
  },
  
  saveDraft: (artifactId) => {
    set((state) => {
      const newDrafts = new Map(state.drafts);
      const draft = newDrafts.get(artifactId);
      
      if (draft) {
        newDrafts.set(artifactId, {
          ...draft,
          originalContent: draft.content, // Update original to current
          isDirty: false, // Mark as clean
        });
      }
      
      return { drafts: newDrafts };
    });
  },
  
  saveAllDrafts: () => {
    set((state) => {
      const newDrafts = new Map(state.drafts);
      
      newDrafts.forEach((draft, artifactId) => {
        newDrafts.set(artifactId, {
          ...draft,
          originalContent: draft.content,
          isDirty: false,
        });
      });
      
      return { drafts: newDrafts };
    });
  },
  
  discardDraft: (artifactId) => {
    set((state) => {
      const newDrafts = new Map(state.drafts);
      const draft = newDrafts.get(artifactId);
      
      if (draft) {
        newDrafts.set(artifactId, {
          ...draft,
          content: draft.originalContent, // Revert to original
          isDirty: false, // Mark as clean
        });
      }
      
      return { drafts: newDrafts };
    });
  },
  
  discardAllDrafts: () => {
    set((state) => {
      const newDrafts = new Map(state.drafts);
      
      newDrafts.forEach((draft, artifactId) => {
        newDrafts.set(artifactId, {
          ...draft,
          content: draft.originalContent,
          isDirty: false,
        });
      });
      
      return { drafts: newDrafts };
    });
  },
}));

// ============================================
// Selectors
// ============================================

/**
 * Select draft for specific artifact
 */
export const useArtifactDraft = (artifactId: string) => {
  return useArtifactDraftStore((state) => state.getDraft(artifactId));
};

/**
 * Select if artifact has unsaved changes
 */
export const useHasUnsavedChanges = (artifactId: string) => {
  return useArtifactDraftStore((state) => state.hasUnsavedChanges(artifactId));
};

/**
 * Select if any artifact has unsaved changes
 */
export const useHasAnyUnsavedChanges = () => {
  return useArtifactDraftStore((state) => state.hasAnyUnsavedChanges());
};

/**
 * Select all dirty drafts
 */
export const useDirtyDrafts = () => {
  return useArtifactDraftStore((state) => state.getDirtyDrafts());
};

/**
 * Select draft count
 */
export const useDraftCount = () => {
  return useArtifactDraftStore((state) => state.getDraftCount());
};

// ============================================
// Helpers
// ============================================

/**
 * Export all drafts as content edits for agent submission
 */
export function exportDraftsForSubmission(): Array<{
  artifactId: string;
  content: TipTapDocument | QAContent | unknown;
}> {
  const dirtyDrafts = useArtifactDraftStore.getState().getDirtyDrafts();
  
  return dirtyDrafts.map((draft) => ({
    artifactId: draft.artifactId,
    content: draft.content,
  }));
}

/**
 * Check if user should be warned before navigation
 */
export function shouldWarnBeforeNavigation(): boolean {
  return useArtifactDraftStore.getState().hasAnyUnsavedChanges();
}

/**
 * Get unsaved changes summary for confirmation dialogs
 */
export function getUnsavedChangesSummary(): string {
  const dirtyDrafts = useArtifactDraftStore.getState().getDirtyDrafts();
  const count = dirtyDrafts.length;
  
  if (count === 0) {
    return 'No unsaved changes';
  }
  
  if (count === 1) {
    return '1 artifact has unsaved changes';
  }
  
  return `${count} artifacts have unsaved changes`;
}