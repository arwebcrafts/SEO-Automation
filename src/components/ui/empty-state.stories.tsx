import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './empty-state';
import { Button } from './button';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

const DefaultIllustration = (
  <svg
    className="w-24 h-24 mx-auto"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

export const Default: Story = {
  args: {
    title: 'No items found',
    description: 'There are no items to display at this time.',
    illustration: DefaultIllustration,
  },
};

export const WithAction: Story = {
  args: {
    title: 'No content yet',
    description: 'Get started by creating your first item.',
    illustration: DefaultIllustration,
    action: <Button variant="primary">Create New</Button>,
  },
};

export const NoIllustration: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
  },
};

export const Simple: Story = {
  args: {
    title: 'Nothing here',
  },
};

export const CustomIllustration: Story = {
  args: {
    title: 'AI Analysis Complete',
    description: 'Your content has been analyzed successfully.',
    illustration: (
      <svg
        className="w-24 h-24 mx-auto text-accent-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    action: <Button variant="primary">View Results</Button>,
  },
};
