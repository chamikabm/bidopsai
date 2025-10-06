/**
 * Web Vitals Integration
 * Tracks Core Web Vitals (CLS, FID, LCP, FCP, TTFB, INP)
 */

import { performanceMonitor, type PerformanceMetric } from './performance-monitor';

type MetricRating = 'good' | 'needs-improvement' | 'poor';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: MetricRating;
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Get rating for CLS (Cumulative Layout Shift)
 */
function getCLSRating(value: number): MetricRating {
  if (value <= 0.1) return 'good';
  if (value <= 0.25) return 'needs-improvement';
  return 'poor';
}

/**
 * Get rating for FID (First Input Delay)
 */
function getFIDRating(value: number): MetricRating {
  if (value <= 100) return 'good';
  if (value <= 300) return 'needs-improvement';
  return 'poor';
}

/**
 * Get rating for LCP (Largest Contentful Paint)
 */
function getLCPRating(value: number): MetricRating {
  if (value <= 2500) return 'good';
  if (value <= 4000) return 'needs-improvement';
  return 'poor';
}

/**
 * Get rating for FCP (First Contentful Paint)
 */
function getFCPRating(value: number): MetricRating {
  if (value <= 1800) return 'good';
  if (value <= 3000) return 'needs-improvement';
  return 'poor';
}

/**
 * Get rating for TTFB (Time to First Byte)
 */
function getTTFBRating(value: number): MetricRating {
  if (value <= 800) return 'good';
  if (value <= 1800) return 'needs-improvement';
  return 'poor';
}

/**
 * Get rating for INP (Interaction to Next Paint)
 */
function getINPRating(value: number): MetricRating {
  if (value <= 200) return 'good';
  if (value <= 500) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vital metric
 */
function reportWebVital(metric: WebVitalsMetric) {
  let rating: MetricRating;

  switch (metric.name) {
    case 'CLS':
      rating = getCLSRating(metric.value);
      break;
    case 'FID':
      rating = getFIDRating(metric.value);
      break;
    case 'LCP':
      rating = getLCPRating(metric.value);
      break;
    case 'FCP':
      rating = getFCPRating(metric.value);
      break;
    case 'TTFB':
      rating = getTTFBRating(metric.value);
      break;
    case 'INP':
      rating = getINPRating(metric.value);
      break;
    default:
      rating = 'good';
  }

  const performanceMetric: PerformanceMetric = {
    name: metric.name,
    value: metric.value,
    rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  };

  performanceMonitor.recordWebVital(performanceMetric);
}

/**
 * Initialize Web Vitals tracking
 * This should be called in the root layout or _app
 */
export async function initWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    // Dynamically import web-vitals to reduce initial bundle size
    // Import from the main entry point
    const webVitals = await import('web-vitals');

    // Track all Core Web Vitals
    webVitals.onCLS(reportWebVital);
    webVitals.onFID(reportWebVital);
    webVitals.onLCP(reportWebVital);
    webVitals.onFCP(reportWebVital);
    webVitals.onTTFB(reportWebVital);
    webVitals.onINP(reportWebVital);
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
}

/**
 * Report Web Vitals to Next.js (for use in _app or layout)
 */
export function reportWebVitalsToNextJS(metric: unknown) {
  reportWebVital(metric);
}
