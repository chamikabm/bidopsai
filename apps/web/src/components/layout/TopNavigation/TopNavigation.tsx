'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { AIAssistantIcon } from './AIAssistantIcon';
import { NotificationsIcon } from './NotificationsIcon';
import { LanguageSelector } from './LanguageSelector';
import { useUIStore } from '@/store/ui-store';

interface TopNavigationProps {
  onMobileMenuToggle?: () => void;
}

export function TopNavigation({ onMobileMenuToggle }: TopNavigationProps) {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Desktop sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 hidden md:flex"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {/* Logo */}
        <Logo />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side icons */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:block">
            <AIAssistantIcon />
          </div>
          <NotificationsIcon unreadCount={0} />
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
