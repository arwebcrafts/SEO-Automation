import type { Meta, StoryObj } from '@storybook/react';
import { TimePicker } from './time-picker';
import { useState } from 'react';

const meta: Meta<typeof TimePicker> = {
  title: 'UI/TimePicker',
  component: TimePicker,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimePicker>;

export const Default: Story = {
  render: () => {
    const [time, setTime] = useState('09:00');
    return <TimePicker value={time} onChange={setTime} />;
  },
};

export const NoSelection: Story = {
  render: () => {
    const [time, setTime] = useState('');
    return <TimePicker value={time} onChange={setTime} />;
  },
};

export const Disabled: Story = {
  render: () => {
    const [time, setTime] = useState('09:00');
    return <TimePicker value={time} onChange={setTime} disabled />;
  },
};
