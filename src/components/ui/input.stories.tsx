import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { FormField } from './form-field';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    error: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your text...',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Sample text',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'you@example.com',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const Error: Story = {
  args: {
    error: true,
    placeholder: 'This field has an error',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
  },
};

export const FormFieldDefault: Story = {
  render: () => (
    <FormField label="Username" hint="Choose a unique username">
      <Input placeholder="Enter username" />
    </FormField>
  ),
};

export const FormFieldRequired: Story = {
  render: () => (
    <FormField label="Email" required hint="We'll never share your email">
      <Input type="email" placeholder="you@example.com" />
    </FormField>
  ),
};

export const FormFieldError: Story = {
  render: () => (
    <FormField label="Password" error="Password must be at least 8 characters" required>
      <Input type="password" placeholder="Enter password" error />
    </FormField>
  ),
};

export const FormFieldNoLabel: Story = {
  render: () => (
    <FormField hint="Optional field">
      <Input placeholder="Optional input" />
    </FormField>
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-8 max-w-md">
      <FormField label="Default" hint="Normal state">
        <Input placeholder="Normal input" />
      </FormField>
      <FormField label="With Value" hint="Has content">
        <Input value="Sample text" />
      </FormField>
      <FormField label="Error" error="This field is required" required>
        <Input placeholder="Error state" error />
      </FormField>
      <FormField label="Disabled" hint="Cannot be edited">
        <Input placeholder="Disabled" disabled />
      </FormField>
    </div>
  ),
};
