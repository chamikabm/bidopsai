'use client';

import { MainLayout } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings2, Bot } from 'lucide-react';
import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { AgentList } from '@/components/settings/AgentConfiguration';
import {
  TwoFactorSettings,
  LanguageSettings,
  TimezoneSettings,
  DataRetentionSettings,
} from '@/components/settings/SystemSettings';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your application preferences and configuration
          </p>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="system" className="space-x-2">
              <Settings2 className="h-4 w-4" />
              <span>System</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="space-x-2">
              <Bot className="h-4 w-4" />
              <span>Agents</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <ThemeSettings />
            <LanguageSettings />
            <TimezoneSettings />
            <TwoFactorSettings />
            <DataRetentionSettings />
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <AgentList />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
