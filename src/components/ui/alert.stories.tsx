import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational alert message.',
  },
};

export const InfoWithTitle: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This is an informational alert message with a title.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your changes have been saved successfully.',
  },
};

export const SuccessWithTitle: Story = {
  args: {
    variant: 'success',
    title: 'Success',
    children: 'Your changes have been saved successfully.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Please review your input before proceeding.',
  },
};

export const WarningWithTitle: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    children: 'Please review your input before proceeding.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'An error occurred while processing your request.',
  },
};

export const ErrorWithTitle: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    children: 'An error occurred while processing your request.',
  },
};

export const Dismissible: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This alert can be dismissed by clicking the X button.',
    onClose: () => console.log('Alert dismissed'),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-8 max-w-lg">
      <Alert variant="info">This is an info alert.</Alert>
      <Alert variant="success">This is a success alert.</Alert>
      <Alert variant="warning">This is a warning alert.</Alert>
      <Alert variant="error">This is an error alert.</Alert>
    </div>
  ),
};

export const WithTitles: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-8 max-w-lg">
      <Alert variant="info" title="Information">Additional details here.</Alert>
      <Alert variant="success" title="Success">Your action completed.</Alert>
      <Alert variant="warning" title="Warning">Please be careful.</Alert>
      <Alert variant="error" title="Error">Something went wrong.</Alert>
    </div>
  ),
};
