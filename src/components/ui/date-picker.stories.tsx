import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from './date-picker';
import { useState } from 'react';

const meta: Meta<typeof DatePicker> = {
  title: 'UI/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['single', 'range', 'multiple'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <DatePicker selected={date} onSelect={setDate} />;
  },
};

export const NoSelection: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return <DatePicker selected={date} onSelect={setDate} />;
  },
};

export const Disabled: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <DatePicker selected={date} onSelect={setDate} disabled />;
  },
};

export const Range: Story = {
  render: () => {
    const [range, setRange] = useState<{ from: Date; to: Date } | undefined>({
      from: new Date(),
      to: new Date(new Date().setDate(new Date().getDate() + 7)),
    });
    return (
      <DatePicker
        mode="range"
        selected={range?.from}
        onSelect={(date) => {
          if (date && 'from' in date && 'to' in date) {
            setRange(date as { from: Date; to: Date });
          }
        }}
      />
    );
  },
};
