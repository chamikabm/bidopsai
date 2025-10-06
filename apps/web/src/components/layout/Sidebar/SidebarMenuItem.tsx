'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  subItems?: MenuItem[];
  requiredPermissions?: string[];
}

interface SidebarMenuItemProps {
  item: MenuItem;
  collapsed: boolean;
}

export function SidebarMenuItem({ item, collapsed }: SidebarMenuItemProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const Icon = item.icon;

  if (collapsed) {
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center justify-center rounded-lg p-3 transition-colors hover:bg-accent',
          isActive && 'bg-accent text-accent-foreground'
        )}
        title={item.label}
      >
        <Icon className="h-5 w-5" />
      </Link>
    );
  }

  if (hasSubItems) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent',
            isActive && 'bg-accent text-accent-foreground'
          )}
        >
          <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </button>
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? 'auto' : 0,
            opacity: isExpanded ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="ml-8 mt-1 space-y-1">
            {item.subItems?.map((subItem) => (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg p-2 text-sm transition-colors hover:bg-accent',
                  pathname === subItem.href && 'bg-accent text-accent-foreground'
                )}
              >
                <subItem.icon className="h-4 w-4" />
                <span>{subItem.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-accent',
        isActive && 'bg-accent text-accent-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}
