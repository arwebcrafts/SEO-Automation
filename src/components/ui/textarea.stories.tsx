import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
  },
};

export const WithValue: Story = {
  args: {
    value: 'This is a sample text in the textarea.',
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
    placeholder: 'Disabled textarea',
  },
};

export const WithFormField: Story = {
  render: () => {
    const { FormField } = require('./form-field');
    const { Textarea } = require('./textarea');
    
    return (
      <FormField label="Description" hint="Provide a detailed description">
        <Textarea placeholder="Enter description..." />
      </FormField>
    );
  },
};
