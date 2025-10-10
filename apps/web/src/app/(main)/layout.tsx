/**
 * Main Application Layout
 *
 * Layout for authenticated pages with sidebar and top navigation
 */

'use client';

import { useState } from 'react';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { AIChatPanel } from '@/components/layout/AIChatPanel';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation onAIAssistantClick={() => setIsAIChatOpen(true)} />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel open={isAIChatOpen} onOpenChange={setIsAIChatOpen} />
    </div>
  );
}