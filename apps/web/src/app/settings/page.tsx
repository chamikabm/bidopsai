'use client';

import { MainLayout } from '@/components/layout';
import { ThemeSettings } from '@/components/settings/ThemeSettings';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your application preferences
          </p>
        </div>
        <ThemeSettings />
      </div>
    </MainLayout>
  );
}
