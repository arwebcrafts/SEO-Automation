import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, illustration, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center p-12 text-center',
          className
        )}
        {...props}
      >
        {illustration && (
          <div className="mb-6 text-slate-300">
            {illustration}
          </div>
        )}
        <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
        {description && (
          <p className="text-slate-500 max-w-md mb-6">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
