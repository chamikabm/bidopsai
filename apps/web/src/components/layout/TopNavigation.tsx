/**
 * Top Navigation Component
 *
 * Main navigation bar with logo, AI assistant, notifications, and language selector
 */

'use client';

import { Logo } from './Logo';
import { AIAssistantIcon } from './AIAssistantIcon';
import { NotificationsIcon } from './NotificationsIcon';
import { LanguageSelector } from './LanguageSelector';
import { MobileSidebar } from './Sidebar/MobileSidebar';

interface TopNavigationProps {
  onAIAssistantClick?: () => void;
  onNotificationsClick?: () => void;
  unreadNotifications?: number;
  className?: string;
}

export function TopNavigation({
  onAIAssistantClick,
  onNotificationsClick,
  unreadNotifications = 0,
  className = '',
}: TopNavigationProps) {
  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left: Mobile menu + Logo */}
        <div className="flex items-center gap-2">
          <MobileSidebar />
          <Logo />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <AIAssistantIcon onClick={onAIAssistantClick} />
          <NotificationsIcon
            unreadCount={unreadNotifications}
            onClick={onNotificationsClick}
          />
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}