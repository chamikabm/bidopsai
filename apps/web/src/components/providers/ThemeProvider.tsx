/**
 * Theme Provider Component
 *
 * Initializes and applies theme to the document root
 * Syncs with useUIStore for theme persistence
 */

'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((state) => state.theme);

  // Use useLayoutEffect to apply theme synchronously before paint
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Also apply on mount to handle SSR
  useEffect(() => {
    applyTheme(theme);
  }, []);

  return <>{children}</>;
}

function applyTheme(theme: string) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Remove all theme classes
  root.classList.remove('light', 'dark', 'deloitte', 'futuristic');
  
  // Add current theme class
  root.classList.add(theme);
  
  // Set data attribute for CSS selectors
  root.setAttribute('data-theme', theme);
}