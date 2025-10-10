'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SidebarMenu } from './SidebarMenu';
import { SidebarUserSection } from './SidebarUserSection';

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <SidebarMenu collapsed={false} />
        </div>
        <div className="border-t p-4">
          <SidebarUserSection collapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
