'use client';

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper for tables that provides horizontal scrolling on mobile
 * and better touch interaction
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        'relative w-full',
        isMobile && 'overflow-x-auto -mx-4 px-4',
        className
      )}
    >
      <div className={cn('min-w-full', isMobile && 'inline-block min-w-max')}>
        {children}
      </div>
    </div>
  );
}

interface MobileCardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  className?: string;
}

/**
 * Alternative to tables on mobile - renders items as cards
 */
export function MobileCardList<T>({
  items,
  renderCard,
  className,
}: MobileCardListProps<T>) {
  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => renderCard(item, index))}
    </div>
  );
}
