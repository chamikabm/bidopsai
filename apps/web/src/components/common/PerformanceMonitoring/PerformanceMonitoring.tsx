'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/performance';

/**
 * Performance Monitoring Component
 * Initializes Web Vitals tracking
 */
export function PerformanceMonitoring() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals();
  }, []);

  // This component doesn't render anything
  return null;
}
