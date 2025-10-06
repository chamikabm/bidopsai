'use client';

import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, HelpCircle, File } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Artifact, ArtifactType, ArtifactCategory } from '@/types/artifact';
import { cn } from '@/lib/utils';

interface ArtifactTileProps {
  artifact: Artifact;
  onClick: (artifact: Artifact) => void;
  className?: string;
}

export function ArtifactTile({ artifact, onClick, className }: ArtifactTileProps) {
  const getIcon = () => {
    if (artifact.category === ArtifactCategory.Q_AND_A) {
      return <HelpCircle className="h-8 w-8" />;
    }
    
    switch (artifact.type) {
      case ArtifactType.EXCEL:
        return <FileSpreadsheet className="h-8 w-8" />;
      case ArtifactType.WORDDOC:
      case ArtifactType.PDF:
        return <FileText className="h-8 w-8" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  const getTypeLabel = () => {
    if (artifact.category === ArtifactCategory.Q_AND_A) {
      return 'Q&A';
    }
    return artifact.type;
  };

  const getStatusColor = () => {
    switch (artifact.status) {
      case 'APPROVED':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'IN_REVIEW':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'cursor-pointer p-4 hover:border-primary/50 transition-all',
          'bg-card/50 backdrop-blur-sm',
          className
        )}
        onClick={() => onClick(artifact)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-primary/70">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm truncate">
                {artifact.name}
              </h4>
              <Badge
                variant="outline"
                className={cn('text-xs flex-shrink-0', getStatusColor())}
              >
                {artifact.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {getTypeLabel()}
              </Badge>
              {artifact.latestVersion && (
                <span>v{artifact.latestVersion.versionNumber}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
