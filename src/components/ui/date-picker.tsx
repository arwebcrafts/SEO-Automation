import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';

export interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  mode?: 'single' | 'range' | 'multiple';
  disabled?: boolean;
  className?: string;
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ selected, onSelect, mode = 'single', disabled, className }, ref) => {
    return (
      <div ref={ref} className={cn('p-3', className)}>
        {/* @ts-ignore - Type compatibility issue with react-day-picker version */}
        <DayPicker
          mode={mode}
          selected={selected}
          onSelect={onSelect}
          disabled={disabled}
          className={cn('rdp border border-slate-200 rounded-lg shadow-sm')}
        />
      </div>
    );
  }
);
DatePicker.displayName = 'DatePicker';

export { DatePicker };
