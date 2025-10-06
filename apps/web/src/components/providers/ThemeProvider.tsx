'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.remove(
      'theme-light',
      'theme-dark',
      'theme-deloitte',
      'theme-futuristic'
    );
    
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  return <>{children}</>;
}
