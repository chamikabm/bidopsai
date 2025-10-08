/**
 * Logo Component
 * 
 * Company logo displayed in top-left corner of navigation
 */

import Link from 'next/link';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <Link 
      href="/dashboard" 
      className={`flex items-center gap-2 font-bold text-xl tracking-tight ${className}`}
    >
      <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">BO</span>
      </div>
      <span className="hidden sm:inline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        BidOps.AI
      </span>
    </Link>
  );
}