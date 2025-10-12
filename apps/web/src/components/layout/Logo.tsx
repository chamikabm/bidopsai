/**
 * Logo Component
 * 
 * Company logo displayed in top-left corner of navigation
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showLabel?: boolean;
  brandName?: string;
}

export function Logo({ className = '', showLabel = true, brandName = 'BidOps.AI' }: LogoProps) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        'group flex items-center font-semibold tracking-tight text-lg transition-all duration-200',
        showLabel ? 'gap-3 justify-start' : 'gap-0 justify-center',
        className
      )}
      aria-label="BidOps.AI dashboard"
    >
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--sidebar-border))]/60 bg-[hsl(var(--sidebar-background))] shadow-sm transition-colors duration-200 group-hover:border-[hsl(var(--primary))]/70 group-hover:shadow-md">
        <div className="absolute inset-[2px] rounded-[0.9rem] bg-gradient-to-br from-primary/80 via-primary/60 to-secondary/75 opacity-95" />
        <span className="relative z-10 text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          BO
        </span>
      </div>
      {showLabel && (
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sidebar-foreground))]">
          {brandName}
        </span>
      )}
    </Link>
  );
}