/**
 * AI Assistant Icon Component
 * 
 * Animated icon that changes color with theme
 * Features glowing/breathing animation
 */

'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/useUIStore';

interface AIAssistantIconProps {
  onClick?: () => void;
  className?: string;
}

export function AIAssistantIcon({ onClick, className = '' }: AIAssistantIconProps) {
  const theme = useUIStore((state) => state.theme);
  
  // Different glow colors based on theme
  const glowColorClass = {
    light: 'animate-breathing-blue',
    dark: 'animate-breathing-purple',
    deloitte: 'animate-breathing-green',
    futuristic: 'animate-breathing-cyan'
  }[theme] || 'animate-breathing-blue';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`relative text-foreground ${className}`}
      aria-label="AI Assistant"
    >
      <div className={`absolute inset-0 rounded-md ${glowColorClass} opacity-30`} />
      <Sparkles className="h-5 w-5 relative z-10" />
    </Button>
  );
}