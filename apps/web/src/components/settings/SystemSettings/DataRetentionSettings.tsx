'use client';

import { useState } from 'react';
import { Database, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const RETENTION_PERIODS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days (Default)' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '6 months' },
  { value: '365', label: '1 year' },
  { value: 'indefinite', label: 'Indefinite' },
];

export function DataRetentionSettings() {
  const [retentionPeriod, setRetentionPeriod] = useState('30');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingPeriod, setPendingPeriod] = useState('30');
  const { toast } = useToast();

  const handleRetentionChange = (value: string) => {
    setPendingPeriod(value);
    setShowConfirmDialog(true);
  };

  const confirmChange = async () => {
    try {
      // TODO: Call API to update data retention settings
      // await updateDataRetentionSettings(pendingPeriod);

      setRetentionPeriod(pendingPeriod);
      setShowConfirmDialog(false);

      toast({
        title: 'Data retention updated',
        description: `Data will be retained for ${RETENTION_PERIODS.find((p) => p.value === pendingPeriod)?.label}`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update data retention settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <CardTitle>Data Retention</CardTitle>
          </div>
          <CardDescription>
            Configure how long project data and artifacts are stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="retention-select">Retention Period</Label>
            <Select value={retentionPeriod} onValueChange={handleRetentionChange}>
              <SelectTrigger id="retention-select">
                <SelectValue placeholder="Select retention period" />
              </SelectTrigger>
              <SelectContent>
                {RETENTION_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Completed projects and their artifacts will be automatically deleted after this
              period
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Important Notice
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Deleted data cannot be recovered. Ensure you have exported any important
                  information before it&apos;s automatically removed.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium">What gets deleted?</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Completed project data and metadata</li>
              <li>• Generated artifacts and documents</li>
              <li>• Workflow execution logs</li>
              <li>• Agent task history</li>
              <li>• Chat conversation history</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium">What is preserved?</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• User accounts and profiles</li>
              <li>• Knowledge base content</li>
              <li>• System configuration</li>
              <li>• Active and in-progress projects</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Data Retention Period?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change how long completed project data is stored before automatic
              deletion. Current retention period:{' '}
              <strong>
                {RETENTION_PERIODS.find((p) => p.value === retentionPeriod)?.label}
              </strong>
              . New retention period:{' '}
              <strong>
                {RETENTION_PERIODS.find((p) => p.value === pendingPeriod)?.label}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange}>Confirm Change</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
