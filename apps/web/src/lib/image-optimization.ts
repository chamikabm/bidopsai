/**
 * Image Optimization Utilities
 * Helpers for optimized image loading
 */

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920]
): string {
  return widths
    .map((width) => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(
  breakpoints: Record<string, string> = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    default: '33vw',
  }
): string {
  const entries = Object.entries(breakpoints);
  const mediaQueries = entries
    .filter(([key]) => key !== 'default')
    .map(([query, size]) => `${query} ${size}`);
  
  const defaultSize = breakpoints.default || '100vw';
  
  return [...mediaQueries, defaultSize].join(', ');
}

/**
 * Get optimized image props for Next.js Image component
 */
export function getOptimizedImageProps(
  src: string,
  alt: string,
  options: {
    priority?: boolean;
    quality?: number;
    sizes?: string;
    fill?: boolean;
  } = {}
) {
  return {
    src,
    alt,
    quality: options.quality || 85,
    priority: options.priority || false,
    sizes: options.sizes || generateSizes(),
    loading: options.priority ? ('eager' as const) : ('lazy' as const),
    ...(options.fill && { fill: true }),
  };
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, as: 'image' = 'image') {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  options: IntersectionObserverInit = {}
) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          const src = target.dataset.src;
          if (src) {
            target.src = src;
            target.removeAttribute('data-src');
          }
          observer.unobserve(target);
        }
      });
    }, options);

    observer.observe(img);
    return () => observer.disconnect();
  } else {
    // Fallback for browsers without Intersection Observer
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
  }
}
