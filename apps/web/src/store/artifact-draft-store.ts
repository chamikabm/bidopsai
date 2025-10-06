import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ArtifactDraft {
  artifactId: string;
  content: unknown; // TipTap JSON or Q&A format
  lastModified: Date;
  hasChanges: boolean;
  originalContent?: unknown; // Store original content for comparison
  versionNumber?: number | undefined; // Track which version this draft is based on
}

export interface DraftVersion {
  id: string;
  artifactId: string;
  content: unknown;
  timestamp: Date;
  label?: string | undefined;
}

interface ArtifactDraftState {
  // Drafts storage
  drafts: Record<string, ArtifactDraft>;
  
  // Version history for drafts (local only, not persisted to backend)
  draftVersions: Record<string, DraftVersion[]>;

  // Draft operations
  setDraft: (artifactId: string, content: unknown, versionNumber?: number) => void;
  getDraft: (artifactId: string) => ArtifactDraft | undefined;
  clearDraft: (artifactId: string) => void;
  clearAllDrafts: () => void;
  hasDraft: (artifactId: string) => boolean;
  getDraftCount: () => number;

  // Version control operations
  saveDraftVersion: (artifactId: string, label?: string) => void;
  getDraftVersions: (artifactId: string) => DraftVersion[];
  restoreDraftVersion: (artifactId: string, versionId: string) => void;
  deleteDraftVersion: (artifactId: string, versionId: string) => void;
  clearDraftVersions: (artifactId: string) => void;

  // Comparison operations
  hasUnsavedChanges: (artifactId: string) => boolean;
  resetToOriginal: (artifactId: string) => void;

  // Batch operations
  setMultipleDrafts: (drafts: Array<{ artifactId: string; content: unknown }>) => void;
  clearMultipleDrafts: (artifactIds: string[]) => void;
}

export const useArtifactDraftStore = create<ArtifactDraftState>()(
  persist(
    (set, get) => ({
      drafts: {},
      draftVersions: {},

      setDraft: (artifactId, content, versionNumber) =>
        set((state) => {
          const existingDraft = state.drafts[artifactId];
          const newDraft: ArtifactDraft = {
            artifactId,
            content,
            lastModified: new Date(),
            hasChanges: true,
            originalContent: existingDraft?.originalContent || content,
            versionNumber: versionNumber ?? undefined,
          };
          return {
            drafts: {
              ...state.drafts,
              [artifactId]: newDraft,
            },
          };
        }),

      getDraft: (artifactId) => {
        const draft = get().drafts[artifactId];
        if (draft) {
          // Convert lastModified back to Date if it was serialized as string
          return {
            ...draft,
            lastModified: new Date(draft.lastModified),
          };
        }
        return undefined;
      },

      clearDraft: (artifactId) =>
        set((state) => {
          const { [artifactId]: _, ...remainingDrafts } = state.drafts;
          return { drafts: remainingDrafts };
        }),

      clearAllDrafts: () => set({ drafts: {}, draftVersions: {} }),

      hasDraft: (artifactId) => {
        return artifactId in get().drafts;
      },

      getDraftCount: () => {
        return Object.keys(get().drafts).length;
      },

      // Version control operations
      saveDraftVersion: (artifactId, label) =>
        set((state) => {
          const draft = state.drafts[artifactId];
          if (!draft) return state;

          const newVersion: DraftVersion = {
            id: `version-${Date.now()}`,
            artifactId,
            content: draft.content,
            timestamp: new Date(),
            label: label ?? undefined,
          };

          const existingVersions = state.draftVersions[artifactId] || [];
          return {
            draftVersions: {
              ...state.draftVersions,
              [artifactId]: [...existingVersions, newVersion],
            },
          };
        }),

      getDraftVersions: (artifactId) => {
        const versions = get().draftVersions[artifactId] || [];
        return versions.map((v) => ({
          ...v,
          timestamp: new Date(v.timestamp),
        }));
      },

      restoreDraftVersion: (artifactId, versionId) =>
        set((state) => {
          const versions = state.draftVersions[artifactId];
          if (!versions) return state;

          const version = versions.find((v) => v.id === versionId);
          if (!version) return state;

          const currentDraft = state.drafts[artifactId];
          const restoredDraft: ArtifactDraft = {
            artifactId,
            content: version.content,
            lastModified: new Date(),
            hasChanges: true,
            originalContent: currentDraft?.originalContent,
            versionNumber: currentDraft?.versionNumber ?? undefined,
          };
          return {
            drafts: {
              ...state.drafts,
              [artifactId]: restoredDraft,
            },
          };
        }),

      deleteDraftVersion: (artifactId, versionId) =>
        set((state) => {
          const versions = state.draftVersions[artifactId];
          if (!versions) return state;

          return {
            draftVersions: {
              ...state.draftVersions,
              [artifactId]: versions.filter((v) => v.id !== versionId),
            },
          };
        }),

      clearDraftVersions: (artifactId) =>
        set((state) => {
          const { [artifactId]: _, ...remainingVersions } = state.draftVersions;
          return { draftVersions: remainingVersions };
        }),

      // Comparison operations
      hasUnsavedChanges: (artifactId) => {
        const draft = get().drafts[artifactId];
        if (!draft || !draft.originalContent) return false;
        return JSON.stringify(draft.content) !== JSON.stringify(draft.originalContent);
      },

      resetToOriginal: (artifactId) =>
        set((state) => {
          const draft = state.drafts[artifactId];
          if (!draft || !draft.originalContent) return state;

          return {
            drafts: {
              ...state.drafts,
              [artifactId]: {
                ...draft,
                content: draft.originalContent,
                lastModified: new Date(),
                hasChanges: false,
              },
            },
          };
        }),

      setMultipleDrafts: (drafts) =>
        set((state) => {
          const newDrafts = drafts.reduce(
            (acc, { artifactId, content }) => {
              acc[artifactId] = {
                artifactId,
                content,
                lastModified: new Date(),
                hasChanges: true,
                originalContent: content,
              };
              return acc;
            },
            {} as Record<string, ArtifactDraft>
          );
          return {
            drafts: { ...state.drafts, ...newDrafts },
          };
        }),

      clearMultipleDrafts: (artifactIds) =>
        set((state) => {
          const newDrafts = { ...state.drafts };
          const newVersions = { ...state.draftVersions };
          artifactIds.forEach((id) => {
            delete newDrafts[id];
            delete newVersions[id];
          });
          return { drafts: newDrafts, draftVersions: newVersions };
        }),
    }),
    {
      name: 'bidops-artifact-drafts',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
