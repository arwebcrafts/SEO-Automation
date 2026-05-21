import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from './progress-bar';

const meta: Meta<typeof ProgressBar> = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['brand', 'success', 'warning', 'error'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    value: {
      control: 'number',
    },
    max: {
      control: 'number',
    },
    showLabel: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: {
    value: 50,
    max: 100,
  },
};

export const Small: Story = {
  args: {
    value: 50,
    max: 100,
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    value: 50,
    max: 100,
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    value: 50,
    max: 100,
    size: 'lg',
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    max: 100,
    label: 'Upload Progress',
    showLabel: true,
  },
};

export const Brand: Story = {
  args: {
    value: 50,
    max: 100,
    variant: 'brand',
  },
};

export const Success: Story = {
  args: {
    value: 100,
    max: 100,
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    value: 60,
    max: 100,
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    value: 30,
    max: 100,
    variant: 'error',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-8 max-w-md">
      <ProgressBar value={50} max={100} size="sm" />
      <ProgressBar value={50} max={100} size="md" />
      <ProgressBar value={50} max={100} size="lg" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-8 max-w-md">
      <ProgressBar value={50} max={100} variant="brand" label="Brand" showLabel />
      <ProgressBar value={100} max={100} variant="success" label="Success" showLabel />
      <ProgressBar value={60} max={100} variant="warning" label="Warning" showLabel />
      <ProgressBar value={30} max={100} variant="error" label="Error" showLabel />
    </div>
  ),
};
