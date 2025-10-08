'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// System settings schema
const systemSettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  twoFactorMethod: z.enum(['sms', 'email', 'authenticator']),
  timezone: z.string().min(1, 'Timezone is required'),
  theme: z.enum(['light', 'dark', 'deloitte', 'futuristic']),
  language: z.enum(['en-US', 'en-AU', 'en-GB']),
  dataRetention: z.enum(['7', '30', '60', '90', '180', '365']),
});

type SystemSettings = z.infer<typeof systemSettingsSchema>;

export default function SystemSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  // Mock system settings
  const mockSettings: SystemSettings = {
    twoFactorEnabled: false,
    twoFactorMethod: 'authenticator',
    timezone: 'Australia/Melbourne',
    theme: 'dark',
    language: 'en-AU',
    dataRetention: '30',
  };

  const form = useForm<SystemSettings>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: mockSettings,
  });

  const handleSave = async (data: SystemSettings) => {
    setIsSaving(true);
    try {
      console.log('Saving system settings:', data);
      // TODO: Implement save mutation
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris, Brussels, Copenhagen' },
    { value: 'Asia/Dubai', label: 'Abu Dhabi, Muscat' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Asia/Tokyo', label: 'Tokyo, Osaka, Sapporo' },
    { value: 'Australia/Sydney', label: 'Sydney, Melbourne, Canberra' },
    { value: 'Australia/Melbourne', label: 'Melbourne' },
    { value: 'Australia/Brisbane', label: 'Brisbane' },
    { value: 'Australia/Perth', label: 'Perth' },
    { value: 'Pacific/Auckland', label: 'Auckland, Wellington' },
  ];

  const themes = [
    { value: 'light', label: 'Light', description: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
    { value: 'deloitte', label: 'Deloitte', description: 'Deloitte brand colors' },
    { value: 'futuristic', label: 'Futuristic', description: 'Cyberpunk aesthetics' },
  ];

  const languages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-AU', label: 'English (Australia)' },
    { value: 'en-GB', label: 'English (UK)' },
  ];

  const retentionPeriods = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days (Recommended)' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' },
    { value: '180', label: '180 days' },
    { value: '365', label: '1 year' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure application-wide settings and preferences
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="twoFactorEnabled">Enable 2FA</Label>
                <p className="text-sm text-muted-foreground">
                  Require two-factor authentication for all users
                </p>
              </div>
              <Switch
                id="twoFactorEnabled"
                checked={form.watch('twoFactorEnabled')}
                onCheckedChange={(checked: boolean) =>
                  form.setValue('twoFactorEnabled', checked)
                }
              />
            </div>

            {form.watch('twoFactorEnabled') && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label>Authentication Method</Label>
                  <RadioGroup
                    value={form.watch('twoFactorMethod')}
                    onValueChange={(value: 'sms' | 'email' | 'authenticator') =>
                      form.setValue('twoFactorMethod', value)
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="authenticator" id="authenticator" />
                      <Label htmlFor="authenticator" className="font-normal cursor-pointer">
                        Authenticator App (Recommended)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sms" id="sms" />
                      <Label htmlFor="sms" className="font-normal cursor-pointer">
                        SMS Text Message
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email" />
                      <Label htmlFor="email" className="font-normal cursor-pointer">
                        Email
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    {form.watch('twoFactorMethod') === 'authenticator' &&
                      'Use apps like Google Authenticator or Authy for secure code generation'}
                    {form.watch('twoFactorMethod') === 'sms' &&
                      'Receive verification codes via SMS (requires phone number)'}
                    {form.watch('twoFactorMethod') === 'email' &&
                      'Receive verification codes via email'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Settings</CardTitle>
            <CardDescription>
              Configure timezone and language preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone *</Label>
              <Select
                value={form.watch('timezone')}
                onValueChange={(value) => form.setValue('timezone', value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All dates and times will be displayed in this timezone
              </p>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language *</Label>
              <Select
                value={form.watch('language')}
                onValueChange={(value: 'en-US' | 'en-AU' | 'en-GB') =>
                  form.setValue('language', value)
                }
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Application interface language and date/number formats
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Theme *</Label>
              <RadioGroup
                value={form.watch('theme')}
                onValueChange={(value: 'light' | 'dark' | 'deloitte' | 'futuristic') =>
                  form.setValue('theme', value)
                }
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {themes.map((theme) => (
                  <div key={theme.value}>
                    <RadioGroupItem
                      value={theme.value}
                      id={theme.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={theme.value}
                      className="flex flex-col items-start space-y-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">{theme.label}</span>
                      <span className="text-xs text-muted-foreground">{theme.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>
              Configure how long project data is retained after completion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dataRetention">Retention Period *</Label>
              <Select
                value={form.watch('dataRetention')}
                onValueChange={(value: '7' | '30' | '60' | '90' | '180' | '365') =>
                  form.setValue('dataRetention', value)
                }
              >
                <SelectTrigger id="dataRetention">
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
                <SelectContent>
                  {retentionPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Completed projects will be archived after this period. Archived projects can be
                restored within 90 days before permanent deletion.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}