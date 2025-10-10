'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandlers } from '@/lib/monitoring';

/**
 * Monitoring Initializer Component
 * Sets up global error handlers and monitoring
 */
export function MonitoringInitializer() {
  useEffect(() => {
    // Set up global error handlers
    setupGlobalErrorHandlers();
  }, []);

  // This component doesn't render anything
  return null;
}
