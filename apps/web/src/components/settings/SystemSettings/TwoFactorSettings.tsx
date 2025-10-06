'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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

export function TwoFactorSettings() {
  const [enabled, setEnabled] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingState, setPendingState] = useState(false);
  const { toast } = useToast();

  const handleToggle = (checked: boolean) => {
    setPendingState(checked);
    setShowConfirmDialog(true);
  };

  const confirmToggle = async () => {
    try {
      // TODO: Call AWS Cognito API to enable/disable 2FA
      // await updateUserMFAPreference(pendingState);

      setEnabled(pendingState);
      setShowConfirmDialog(false);

      toast({
        title: pendingState ? '2FA Enabled' : '2FA Disabled',
        description: pendingState
          ? 'Two-factor authentication has been enabled for your account'
          : 'Two-factor authentication has been disabled for your account',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update two-factor authentication settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            {enabled ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Shield className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="2fa-toggle">Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Require a verification code in addition to your password
              </p>
            </div>
            <Switch
              id="2fa-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
            />
          </div>

          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-green-500/20 bg-green-500/10 p-4"
            >
              <div className="flex items-start space-x-3">
                <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Two-factor authentication is active
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Your account is protected with an additional security layer. You&apos;ll need
                    to enter a verification code when signing in.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium">How it works</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>Download an authenticator app (Google Authenticator, Authy, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>Scan the QR code or enter the setup key</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>Enter the 6-digit code from your app to verify</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingState ? 'Enable' : 'Disable'} Two-Factor Authentication?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingState
                ? 'You will need to set up an authenticator app and enter a verification code when signing in.'
                : 'Your account will be less secure without two-factor authentication. Are you sure you want to disable it?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>
              {pendingState ? 'Enable' : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
