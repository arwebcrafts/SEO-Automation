import type { Meta, StoryObj } from '@storybook/react';
import { NumberStepper } from './number-stepper';
import { useState } from 'react';

const meta: Meta<typeof NumberStepper> = {
  title: 'UI/NumberStepper',
  component: NumberStepper,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    min: {
      control: 'number',
    },
    max: {
      control: 'number',
    },
    step: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NumberStepper>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(5);
    return <NumberStepper value={value} onChange={setValue} />;
  },
};

export const WithRange: Story = {
  render: () => {
    const [value, setValue] = useState(50);
    return <NumberStepper value={value} onChange={setValue} min={0} max={100} />;
  },
};

export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState(5);
    return <NumberStepper value={value} onChange={setValue} disabled />;
  },
};

export const CustomStep: Story = {
  render: () => {
    const [value, setValue] = useState(10);
    return <NumberStepper value={value} onChange={setValue} min={0} max={100} step={5} />;
  },
};
