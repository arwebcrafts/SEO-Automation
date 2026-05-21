import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressBarVariants = cva('h-2 rounded-full overflow-hidden bg-slate-200', {
  variants: {
    variant: {
      brand: 'bg-slate-200',
      success: 'bg-success-100',
      warning: 'bg-warning-100',
      error: 'bg-error-100',
    },
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: {
    variant: 'brand',
    size: 'md',
  },
});

const fillVariants = cva('h-full transition-all duration-300 ease-out', {
  variants: {
    variant: {
      brand: 'bg-brand-600',
      success: 'bg-success-600',
      warning: 'bg-warning-600',
      error: 'bg-error-600',
    },
  },
  defaultVariants: {
    variant: 'brand',
  },
});

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, variant, size, value, max = 100, showLabel, label, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {(showLabel || label) && (
          <div className="flex justify-between items-center mb-2">
            {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
            {showLabel && <span className="text-sm text-slate-600">{Math.round(percentage)}%</span>}
          </div>
        )}
        <div className={cn(progressBarVariants({ variant, size }))}>
          <div
            className={cn(fillVariants({ variant }))}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
      </div>
    );
  }
);
ProgressBar.displayName = 'ProgressBar';

export { ProgressBar, progressBarVariants };
