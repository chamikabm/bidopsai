/**
 * Sidebar Menu Item Component
 *
 * Individual menu item with icon, label, and sub-items
 */

'use client';

import { useEffect, useState } from 'react';
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

  const pathMatches = (target?: string) => {
    if (!target) return false;
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = escaped.replace(/\\\[([^/]+)\\\]/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  };

  const isActive = pathMatches(item.href);
  const isSubItemActive = hasSubItems && item.items?.some((subItem) => pathMatches(subItem.href));
  
  // Auto-expand parent menu if a sub-item is active
  const [isOpen, setIsOpen] = useState(isSubItemActive);

  useEffect(() => {
    if (isSubItemActive) {
      setIsOpen(true);
    } else if (!isActive) {
      setIsOpen(false);
    }
  }, [isSubItemActive, isActive]);
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
                'w-full justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]',
                isSubItemActive && 'bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-foreground))] font-semibold shadow-inner'
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
                      'w-full cursor-pointer rounded-md transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]',
                      isSubActive && 'bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-foreground))] font-medium shadow-inner'
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
            'w-full justify-start gap-2 rounded-lg text-sidebar-foreground transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]',
            (isSubItemActive || isActive) && 'bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-foreground))] font-semibold shadow-inner'
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
                      'w-full justify-start h-8 rounded-md text-muted-foreground transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]',
                      isSubActive && 'bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-foreground))] font-medium shadow-inner'
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
          'w-full rounded-lg text-sidebar-foreground transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))]',
          collapsed ? 'justify-center' : 'justify-start gap-2',
          isActive && 'bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-foreground))] font-semibold shadow-inner'
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