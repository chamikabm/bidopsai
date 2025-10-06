'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function EmptyProjectsState() {
  const router = useRouter();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Active Projects</h3>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
          You don't have any active projects yet. Create your first project to start
          automating your bid preparation process.
        </p>
        <Button onClick={() => router.push('/projects/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
      </CardContent>
    </Card>
  );
}
