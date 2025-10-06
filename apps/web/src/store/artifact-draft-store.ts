import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ArtifactDraft {
  artifactId: string;
  content: any; // TipTap JSON or Q&A format
  lastModified: Date;
  hasChanges: boolean;
}

interface ArtifactDraftState {
  // Drafts storage
  drafts: Record<string, ArtifactDraft>;

  // Draft operations
  setDraft: (artifactId: string, content: any) => void;
  getDraft: (artifactId: string) => ArtifactDraft | undefined;
  clearDraft: (artifactId: string) => void;
  clearAllDrafts: () => void;
  hasDraft: (artifactId: string) => boolean;
  getDraftCount: () => number;

  // Batch operations
  setMultipleDrafts: (drafts: Array<{ artifactId: string; content: any }>) => void;
  clearMultipleDrafts: (artifactIds: string[]) => void;
}

export const useArtifactDraftStore = create<ArtifactDraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      setDraft: (artifactId, content) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [artifactId]: {
              artifactId,
              content,
              lastModified: new Date(),
              hasChanges: true,
            },
          },
        })),

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

      clearAllDrafts: () => set({ drafts: {} }),

      hasDraft: (artifactId) => {
        return artifactId in get().drafts;
      },

      getDraftCount: () => {
        return Object.keys(get().drafts).length;
      },

      setMultipleDrafts: (drafts) =>
        set((state) => {
          const newDrafts = drafts.reduce(
            (acc, { artifactId, content }) => {
              acc[artifactId] = {
                artifactId,
                content,
                lastModified: new Date(),
                hasChanges: true,
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
          artifactIds.forEach((id) => {
            delete newDrafts[id];
          });
          return { drafts: newDrafts };
        }),
    }),
    {
      name: 'bidops-artifact-drafts',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
