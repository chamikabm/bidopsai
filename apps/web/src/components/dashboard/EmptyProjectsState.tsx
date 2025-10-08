/**
 * Empty Projects State Component
 * 
 * Displayed when user has no active projects
 */

'use client';

import { Button } from '@/components/ui/button';
import { FolderPlus } from 'lucide-react';
import Link from 'next/link';

export function EmptyProjectsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="mb-4 rounded-full bg-primary/10 p-6">
        <FolderPlus className="h-12 w-12 text-primary" />
      </div>

      {/* Heading */}
      <h3 className="mb-2 text-xl font-semibold">No Active Projects</h3>

      {/* Description */}
      <p className="mb-6 max-w-md text-muted-foreground">
        Get started by creating your first project. Upload documents, select
        knowledge bases, and let our AI agents help you prepare winning bids.
      </p>

      {/* CTA Button */}
      <Button asChild size="lg">
        <Link href="/projects/new">
          <FolderPlus className="mr-2 h-5 w-5" />
          Create Your First Project
        </Link>
      </Button>
    </div>
  );
}