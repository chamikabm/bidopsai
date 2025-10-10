'use client';

import { useState } from 'react';
import { Artifact } from '@/types/artifact';
import { ArtifactTile } from './ArtifactTile';
import { ArtifactModal } from './ArtifactModal';

interface ArtifactRendererProps {
  artifacts: Artifact[];
  onSave?: (artifactId: string, content: unknown) => void;
  editable?: boolean;
  className?: string;
}

/**
 * ArtifactRenderer - Renders a list of artifacts as tiles and handles opening the modal
 * 
 * Usage example:
 * ```tsx
 * const artifacts = useArtifacts(projectId);
 * 
 * <ArtifactRenderer
 *   artifacts={artifacts.data || []}
 *   onSave={(artifactId, content) => {
 *     // Handle saving the artifact
 *     updateArtifact.mutate({ id: artifactId, input: { content } });
 *   }}
 *   editable={true}
 * />
 * ```
 */
export function ArtifactRenderer({
  artifacts,
  onSave,
  editable = true,
  className,
}: ArtifactRendererProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleArtifactClick = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    // Small delay before clearing to allow modal animation to complete
    setTimeout(() => setSelectedArtifact(null), 200);
  };

  return (
    <>
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {artifacts.map((artifact) => (
            <ArtifactTile
              key={artifact.id}
              artifact={artifact}
              onClick={handleArtifactClick}
            />
          ))}
        </div>
      </div>

      <ArtifactModal
        artifact={selectedArtifact}
        open={modalOpen}
        onClose={handleModalClose}
        onSave={onSave}
        editable={editable}
      />
    </>
  );
}
