import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Badge } from './badge';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p className="text-slate-700">Content for Tab 1</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p className="text-slate-700">Content for Tab 2</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p className="text-slate-700">Content for Tab 3</p>
      </TabsContent>
    </Tabs>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1" badge={<Badge variant="brand">5</Badge>}>
          Overview
        </TabsTrigger>
        <TabsTrigger value="tab2" badge={<Badge variant="warning">12</Badge>}>
          Pending
        </TabsTrigger>
        <TabsTrigger value="tab3" badge={<Badge variant="success">3</Badge>}>
          Completed
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p className="text-slate-700">Overview content</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p className="text-slate-700">Pending items content</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p className="text-slate-700">Completed items content</p>
      </TabsContent>
    </Tabs>
  ),
};
