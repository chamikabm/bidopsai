/**
 * Sidebar Component
 * 
 * Left sidebar with collapsible menu and user section
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarMenu } from './SidebarMenu';
import { SidebarUserSection } from './SidebarUserSection';
import { MAIN_MENU_ITEMS, SETTINGS_MENU_ITEMS } from '@/config/menu.config';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-7 z-50 h-6 w-6 rounded-full border bg-background shadow-md"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Menu content */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-4">
          {/* Main menu */}
          <SidebarMenu items={MAIN_MENU_ITEMS} collapsed={collapsed} />
          
          <Separator />
          
          {/* Settings menu */}
          <SidebarMenu items={SETTINGS_MENU_ITEMS} collapsed={collapsed} />
        </div>
      </ScrollArea>

      {/* User section */}
      <div className="border-t p-3">
        <SidebarUserSection collapsed={collapsed} />
      </div>
    </aside>
  );
}