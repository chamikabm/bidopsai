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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarMenuItemProps {
  item: MenuItem;
  collapsed?: boolean;
}

export function SidebarMenuItem({ item, collapsed = false }: SidebarMenuItemProps) {
  const pathname = usePathname();
  const hasSubItems = item.items && item.items.length > 0;
  const isSubItemActive = hasSubItems && item.items?.some(subItem => pathname === subItem.href);
  
  // Auto-expand parent menu if a sub-item is active
  const [isOpen, setIsOpen] = useState(isSubItemActive || false);
  
  const isActive = item.href ? pathname === item.href : false;
  const Icon = item.icon;

  // If it has sub-items, render as collapsible or dropdown
  if (hasSubItems) {
    // When collapsed, show as dropdown menu
    if (collapsed) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-center rounded-md text-foreground',
                isSubItemActive && 'bg-accent text-accent-foreground font-medium'
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48">
            {item.items?.map((subItem) => {
              const isSubActive = pathname === subItem.href;
              return (
                <DropdownMenuItem key={subItem.id} asChild>
                  <Link
                    href={subItem.href || '#'}
                    className={cn(
                      'w-full cursor-pointer',
                      isSubActive && 'bg-accent'
                    )}
                  >
                    {subItem.label}
                    {subItem.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {subItem.badge}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    
    // When expanded, show as collapsible inline menu
    return (
      <div className="space-y-1">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-2 text-foreground rounded-md',
            (isSubItemActive || isOpen) && 'bg-accent text-accent-foreground font-medium'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          <span className="flex-1 text-left">{item.label}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </Button>
        
        {isOpen && (
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
          'w-full rounded-md text-foreground',
          collapsed ? 'justify-center' : 'justify-start gap-2',
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