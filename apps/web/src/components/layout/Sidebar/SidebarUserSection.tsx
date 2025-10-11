/**
 * Sidebar User Section Component
 * 
 * Bottom section with user avatar, name, role, settings, and logout
 */

'use client';

import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

interface SidebarUserSectionProps {
  collapsed?: boolean;
}

export function SidebarUserSection({ collapsed = false }: SidebarUserSectionProps) {
  const { user, signOut } = useAuth();
  const { primaryRole } = usePermissions();
  const [isMounted, setIsMounted] = useState(false);
  
  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleSignOut = () => {
    signOut();
  };
  
  // During SSR or when no user, render a placeholder to maintain consistent HTML structure
  if (!isMounted) {
    // Render same structure as when user exists, but with placeholder content
    if (collapsed) {
      return (
        <Button variant="ghost" size="icon" className="h-10 w-10 opacity-0">
          <div className="h-8 w-8" />
        </Button>
      );
    }
    return (
      <Button variant="ghost" className="w-full justify-start gap-3 px-2 text-foreground opacity-0">
        <div className="h-8 w-8 rounded-full" />
        <div className="flex flex-col items-start text-left">
          <span className="text-sm font-medium">Loading</span>
          <span className="text-xs">...</span>
        </div>
      </Button>
    );
  }
  
  // After mount, if no user, return null
  if (!user) {
    return null;
  }
  
  // Get user details from Cognito attributes
  const userName = user.username || 'User';
  const userInitials = userName.substring(0, 2).toUpperCase();
  const userRole = primaryRole || 'User';
  
  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Avatar className="h-8 w-8">
              <AvatarImage src={undefined} alt={userName} />
              <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">{userRole}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-2 text-foreground"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={undefined} alt={userName} />
              <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium text-foreground">{userName}</span>
              <span className="text-xs text-muted-foreground">{userRole}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}