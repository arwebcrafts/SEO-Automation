import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NumberStepperProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const NumberStepper = React.forwardRef<HTMLDivElement, NumberStepperProps>(
  ({ className, value = 0, onChange, min = 0, max = 100, step = 1, disabled }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value);

    React.useEffect(() => {
      setInternalValue(value);
    }, [value]);

    const handleIncrement = () => {
      const newValue = Math.min(internalValue + step, max);
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    const handleDecrement = () => {
      const newValue = Math.max(internalValue - step, min);
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      if (!isNaN(newValue)) {
        const clampedValue = Math.min(Math.max(newValue, min), max);
        setInternalValue(clampedValue);
        onChange?.(clampedValue);
      }
    };

    return (
      <div ref={ref} className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || internalValue <= min}
          className={cn(
            'h-10 w-10 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors',
            disabled && 'opacity-50'
          )}
          aria-label="Decrease value"
        >
          <Minus className="h-4 w-4 text-slate-600" />
        </button>
        <input
          type="number"
          value={internalValue}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'h-10 w-20 border border-slate-300 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || internalValue >= max}
          className={cn(
            'h-10 w-10 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors',
            disabled && 'opacity-50'
          )}
          aria-label="Increase value"
        >
          <Plus className="h-4 w-4 text-slate-600" />
        </button>
      </div>
    );
  }
);
NumberStepper.displayName = 'NumberStepper';

export { NumberStepper };
