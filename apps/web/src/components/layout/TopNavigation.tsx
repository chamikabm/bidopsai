/**
 * Top Navigation Component
 *
 * Main navigation bar with AI assistant, notifications, and language selector
 */

'use client';

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
      className={`sticky top-0 z-50 w-full border-b border-border bg-card ${className}`}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left: Mobile menu (only visible on mobile) */}
        <div className="md:hidden">
          <MobileSidebar />
        </div>
        
        {/* Spacer for desktop */}
        <div className="hidden md:block flex-1" />

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-auto">
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