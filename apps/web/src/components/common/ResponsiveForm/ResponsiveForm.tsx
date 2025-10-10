'use client';

import { cn } from '@/lib/utils';

interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  layout?: 'single' | 'two-column';
}

export function ResponsiveForm({
  children,
  className,
  onSubmit,
  layout = 'single',
}: ResponsiveFormProps) {
  const layoutClasses = {
    single: 'space-y-4',
    'two-column': 'grid grid-cols-1 md:grid-cols-2 gap-4',
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn('w-full', layoutClasses[layout], className)}
    >
      {children}
    </form>
  );
}

interface FormSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  fullWidth?: boolean;
}

export function FormSection({
  children,
  className,
  title,
  description,
  fullWidth = false,
}: FormSectionProps) {
  return (
    <div className={cn('space-y-4', fullWidth && 'md:col-span-2', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
