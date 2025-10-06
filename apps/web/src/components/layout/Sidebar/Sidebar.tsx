'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SidebarMenu } from './SidebarMenu';
import { SidebarUserSection } from './SidebarUserSection';
import { useUIStore } from '@/store/ui-store';

export function Sidebar() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  return (
    <motion.aside
      initial={false}
      animate={{
        width: sidebarCollapsed ? '4rem' : '16rem',
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      className={cn(
        'hidden md:flex flex-col border-r bg-background',
        'sticky top-16 h-[calc(100vh-4rem)]'
      )}
    >
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <SidebarMenu collapsed={sidebarCollapsed} />
      </div>
      <div className="border-t p-4">
        <SidebarUserSection collapsed={sidebarCollapsed} />
      </div>
    </motion.aside>
  );
}
