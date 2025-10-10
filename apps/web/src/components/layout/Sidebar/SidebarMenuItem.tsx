/**
 * Sidebar Menu Item Component
 * 
 * Individual menu item with icon, label, and sub-items
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MenuItem } from '@/types/menu.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarMenuItemProps {
  item: MenuItem;
  collapsed?: boolean;
}

export function SidebarMenuItem({ item, collapsed = false }: SidebarMenuItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  const hasSubItems = item.items && item.items.length > 0;
  const isActive = item.href ? pathname === item.href : false;
  const isSubItemActive = hasSubItems && item.items?.some(subItem => pathname === subItem.href);
  
  const Icon = item.icon;

  // If it has sub-items, render as collapsible
  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-2 text-foreground rounded-md',
            (isSubItemActive || isOpen) && 'bg-accent text-accent-foreground'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
            </>
          )}
        </Button>
        
        {!collapsed && isOpen && (
          <div className="ml-6 space-y-1 border-l border-border pl-4 py-1">
            {item.items?.map((subItem) => {
              const isSubActive = pathname === subItem.href;
              return (
                <Link key={subItem.id} href={subItem.href || '#'} className="block mb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'w-full justify-start text-muted-foreground rounded-md h-8',
                      isSubActive && 'bg-accent text-accent-foreground font-medium'
                    )}
                  >
                    {subItem.label}
                    {subItem.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {subItem.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Single menu item without sub-items
  return (
    <Link href={item.href || '#'} className="block mb-1">
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start gap-2 text-foreground rounded-md',
          isActive && 'bg-accent text-accent-foreground font-medium'
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Button>
    </Link>
  );
}