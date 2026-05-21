import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
        <DayPicker
          mode={mode}
          selected={selected}
          onSelect={onSelect}
          disabled={disabled}
          className={cn(
            'rdp',
            'border border-slate-200 rounded-lg shadow-sm'
          )}
          classNames={{
            months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label: 'text-sm font-medium text-slate-900',
            nav: 'space-x-1 flex items-center',
            nav_button: cn(
              'h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed'
            ),
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse space-y-1',
            head_row: 'flex',
            head_cell: 'text-slate-500 rounded-md w-9 font-normal text-[0.8rem]',
            row: 'flex w-full mt-2',
            cell: cn(
              'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-brand-50 [&:has([aria-selected].day-outside)]:bg-brand-50/50 [&:has([aria-selected].day-range-end)]:rounded-r-md',
              '[&:has([aria-selected].day-range-start)]:rounded-l-md',
              '[&:has([aria-selected][aria-selected-outside])]:bg-brand-50/50',
              '[&:has([aria-selected][aria-selected-outside])]:text-brand-400',
              '[&:has([aria-selected][aria-selected-outside])]:opacity-50',
              mode === 'range'
                ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
                : ''
            ),
            day: cn(
              'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md'
            ),
            day_range_start: 'day-range-start bg-brand-600 text-white hover:bg-brand-700',
            day_range_end: 'day-range-end bg-brand-600 text-white hover:bg-brand-700',
            day_selected: 'bg-brand-600 text-white hover:bg-brand-700 focus:bg-brand-600 focus:text-white',
            day_today: 'bg-slate-100 text-slate-900',
            day_outside:
              'day-outside text-slate-400 opacity-50 aria-selected:bg-brand-50 aria-selected:text-brand-400 aria-selected:opacity-30',
            day_disabled: 'text-slate-400 opacity-50',
            day_range_middle:
              'aria-selected:bg-brand-50 aria-selected:text-brand-900',
            day_hidden: 'invisible',
          }}
          components={{
            IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
            IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
          }}
        />
      </div>
    );
  }
);
DatePicker.displayName = 'DatePicker';

export { DatePicker };
