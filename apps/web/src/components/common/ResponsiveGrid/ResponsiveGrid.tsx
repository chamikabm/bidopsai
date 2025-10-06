'use client';

import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: 1 | 2;
    tablet?: 2 | 3 | 4;
    desktop?: 2 | 3 | 4 | 5 | 6;
  };
  gap?: 'sm' | 'md' | 'lg';
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
}: ResponsiveGridProps) {
  const mobileColsClass = cols.mobile === 2 ? 'grid-cols-2' : 'grid-cols-1';
  const tabletColsClass = cols.tablet ? `md:grid-cols-${cols.tablet}` : '';
  const desktopColsClass = cols.desktop ? `lg:grid-cols-${cols.desktop}` : '';

  return (
    <div
      className={cn(
        'grid',
        mobileColsClass,
        tabletColsClass,
        desktopColsClass,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}
