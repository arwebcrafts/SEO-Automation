import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './spinner';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    color: {
      control: 'select',
      options: ['brand', 'success', 'warning', 'error', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {
    size: 'md',
    color: 'brand',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    color: 'brand',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    color: 'brand',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    color: 'brand',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    color: 'brand',
  },
};

export const Brand: Story = {
  args: {
    size: 'md',
    color: 'brand',
  },
};

export const Success: Story = {
  args: {
    size: 'md',
    color: 'success',
  },
};

export const Warning: Story = {
  args: {
    size: 'md',
    color: 'warning',
  },
};

export const Error: Story = {
  args: {
    size: 'md',
    color: 'error',
  },
};

export const Info: Story = {
  args: {
    size: 'md',
    color: 'info',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8 p-8">
      <Spinner size="sm" color="brand" />
      <Spinner size="md" color="brand" />
      <Spinner size="lg" color="brand" />
      <Spinner size="xl" color="brand" />
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div className="flex items-center gap-8 p-8">
      <Spinner size="md" color="brand" />
      <Spinner size="md" color="success" />
      <Spinner size="md" color="warning" />
      <Spinner size="md" color="error" />
      <Spinner size="md" color="info" />
    </div>
  ),
};
