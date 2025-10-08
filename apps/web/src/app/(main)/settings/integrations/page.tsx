'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, TestTube, Check, X, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Slack integration schema
const slackConfigSchema = z.object({
  webhookUrl: z.string().url('Must be a valid URL').min(1, 'Webhook URL is required'),
  channel: z.string().min(1, 'Channel is required').regex(/^#[a-z0-9-_]+$/, 'Channel must start with # and contain only lowercase letters, numbers, hyphens, and underscores'),
  token: z.string().min(1, 'Token is required'),
  enabled: z.boolean(),
});

type SlackConfig = z.infer<typeof slackConfigSchema>;

interface TestResult {
  success: boolean;
  message: string;
}

export default function IntegrationsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Mock Slack configuration
  const mockSlackConfig: SlackConfig = {
    webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
    channel: '#bidops-notifications',
    token: 'xoxb-your-slack-bot-token',
    enabled: true,
  };

  const form = useForm<SlackConfig>({
    resolver: zodResolver(slackConfigSchema),
    defaultValues: mockSlackConfig,
  });

  const handleSave = async (data: SlackConfig) => {
    setIsSaving(true);
    try {
      console.log('Saving Slack configuration:', data);
      // TODO: Implement save mutation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTestResult(null); // Clear test result after saving
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const values = form.getValues();
      console.log('Testing Slack integration with:', values);
      
      // TODO: Implement actual test API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Mock success response
      const success = Math.random() > 0.3;
      setTestResult({
        success,
        message: success
          ? 'Successfully sent a test message to your Slack channel!'
          : 'Failed to send message. Please check your webhook URL and token.',
      });
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        message: 'An error occurred while testing the integration.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Manage external service integrations for notifications and automation
        </p>
      </div>

      {/* Slack Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
                    fill="#E01E5A"
                  />
                </svg>
                Slack Integration
              </CardTitle>
              <CardDescription className="mt-2">
                Send notifications to your Slack workspace when tasks complete
              </CardDescription>
            </div>
            <Switch
              checked={form.watch('enabled')}
              onCheckedChange={(checked: boolean) => form.setValue('enabled', checked)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            {/* Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL *</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                {...form.register('webhookUrl')}
              />
              {form.formState.errors.webhookUrl && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.webhookUrl.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Your Slack incoming webhook URL. Create one in your Slack workspace settings.
              </p>
            </div>

            {/* Channel */}
            <div className="space-y-2">
              <Label htmlFor="channel">Default Channel *</Label>
              <Input
                id="channel"
                type="text"
                placeholder="#bidops-notifications"
                {...form.register('channel')}
              />
              {form.formState.errors.channel && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.channel.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Channel name must start with # (e.g., #bidops-notifications)
              </p>
            </div>

            {/* Bot Token */}
            <div className="space-y-2">
              <Label htmlFor="token">Bot Token *</Label>
              <Input
                id="token"
                type="password"
                placeholder="xoxb-your-slack-bot-token"
                {...form.register('token')}
              />
              {form.formState.errors.token && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.token.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Your Slack bot token for API access
              </p>
            </div>

            <Separator />

            {/* Test Result */}
            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </div>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || isSaving || !form.formState.isValid}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button type="submit" disabled={isSaving || isTesting}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Email Integration (Future) */}
      <Card className="mt-6 opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 8L10.89 13.26C11.5 13.67 12.5 13.67 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Email Integration
          </CardTitle>
          <CardDescription className="mt-2">
            Configure SMTP settings for email notifications (Coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email integration will be available in a future release.
          </p>
        </CardContent>
      </Card>

      {/* Portal Integration (Future) */}
      <Card className="mt-6 opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Submission Portal Integration
          </CardTitle>
          <CardDescription className="mt-2">
            Connect to external bid submission portals (Coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Portal integration for automated bid submission will be available in a future release.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}