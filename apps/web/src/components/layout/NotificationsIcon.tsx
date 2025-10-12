/**
 * Notifications Icon Component
 *
 * Bell icon with unread count badge and dropdown menu
 */

'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificationsIconProps {
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

// Mock notifications data - replace with real data from API
const mockNotifications: Array<{
  id: number;
  title: string;
  message: string;
  time: string;
}> = [
  // { id: 1, title: 'New project created', message: 'Project "BidOps AI" has been created', time: '5 min ago' },
  // { id: 2, title: 'Task completed', message: 'Document analysis completed', time: '1 hour ago' },
];

export function NotificationsIcon({
  unreadCount = 0,
  onClick,
  className = ''
}: NotificationsIconProps) {
  const hasNotifications = mockNotifications.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasNotifications ? (
          <>
            {mockNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 cursor-pointer p-3"
                onClick={onClick}
              >
                <div className="font-medium text-sm">{notification.title}</div>
                <div className="text-xs text-muted-foreground">{notification.message}</div>
                <div className="text-xs text-muted-foreground">{notification.time}</div>
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}