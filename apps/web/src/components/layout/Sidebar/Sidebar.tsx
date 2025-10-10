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
import { Logo } from '../Logo';
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
        'relative flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo section with toggle button */}
      <div className="flex h-16 items-center justify-center px-2">
        {collapsed ? (
          <>
            {/* Toggle button - centered when collapsed */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground shadow-none"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Logo />
            <div className="flex-1" />
            {/* Toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-foreground shadow-none"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      
      {/* Separator below logo */}
      <Separator />

      {/* Menu content */}
      <ScrollArea className="flex-1 py-4 px-2">
        <div className="space-y-4">
          {/* Main menu */}
          <SidebarMenu items={MAIN_MENU_ITEMS} collapsed={collapsed} />
          
          <Separator />
          
          {/* Settings menu */}
          <SidebarMenu items={SETTINGS_MENU_ITEMS} collapsed={collapsed} />
        </div>
      </ScrollArea>

      {/* User section */}
      <div>
        <Separator />
        <div className="p-3">
          <SidebarUserSection collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}