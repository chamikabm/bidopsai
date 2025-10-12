/**
 * Mobile Sidebar Component
 * 
 * Burger menu with drawer for mobile devices
 */

'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Logo } from '../Logo';
import { SidebarMenu } from './SidebarMenu';
import { SidebarUserSection } from './SidebarUserSection';
import { MAIN_MENU_ITEMS, SETTINGS_MENU_ITEMS } from '@/config/menu.config';

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-4">
            {/* Main menu */}
            <SidebarMenu items={MAIN_MENU_ITEMS} />
            
            <Separator />
            
            {/* Settings menu */}
            <SidebarMenu items={SETTINGS_MENU_ITEMS} />
          </div>
        </ScrollArea>

        {/* User section */}
        <div className="border-t p-3">
          <SidebarUserSection />
        </div>
      </SheetContent>
    </Sheet>
  );
}