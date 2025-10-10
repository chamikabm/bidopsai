/**
 * Notifications Icon Component
 * 
 * Bell icon with unread count badge
 */

'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NotificationsIconProps {
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

export function NotificationsIcon({ 
  unreadCount = 0, 
  onClick, 
  className = '' 
}: NotificationsIconProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`relative text-foreground ${className}`}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 text-xs rounded-full"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}