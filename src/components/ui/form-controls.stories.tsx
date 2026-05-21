import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import { Switch } from './switch';
import { RadioGroup, RadioGroupItem } from './radio-group';

const meta: Meta = {
  title: 'UI/Form Controls',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const CheckboxDefault: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <label htmlFor="terms" className="text-sm text-slate-700">
        Accept terms and conditions
      </label>
    </div>
  ),
};

export const CheckboxChecked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" defaultChecked />
      <label htmlFor="terms" className="text-sm text-slate-700">
        Accept terms and conditions
      </label>
    </div>
  ),
};

export const CheckboxDisabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" disabled />
      <label htmlFor="terms" className="text-sm text-slate-400">
        Disabled checkbox
      </label>
    </div>
  ),
};

export const SwitchDefault: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="notifications" />
      <label htmlFor="notifications" className="text-sm text-slate-700">
        Enable notifications
      </label>
    </div>
  ),
};

export const SwitchChecked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="notifications" defaultChecked />
      <label htmlFor="notifications" className="text-sm text-slate-700">
        Enable notifications
      </label>
    </div>
  ),
};

export const SwitchDisabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="notifications" disabled />
      <label htmlFor="notifications" className="text-sm text-slate-400">
        Disabled switch
      </label>
    </div>
  ),
};

export const RadioGroupDefault: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option1" id="r1" />
        <label htmlFor="r1" className="text-sm text-slate-700">Option 1</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option2" id="r2" />
        <label htmlFor="r2" className="text-sm text-slate-700">Option 2</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option3" id="r3" />
        <label htmlFor="r3" className="text-sm text-slate-700">Option 3</label>
      </div>
    </RadioGroup>
  ),
};

export const AllControls: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-8 max-w-md">
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Checkboxes</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="c1" />
          <label htmlFor="c1" className="text-sm text-slate-700">Option 1</label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="c2" defaultChecked />
          <label htmlFor="c2" className="text-sm text-slate-700">Option 2</label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Switches</h3>
        <div className="flex items-center gap-2">
          <Switch id="s1" />
          <label htmlFor="s1" className="text-sm text-slate-700">Toggle 1</label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="s2" defaultChecked />
          <label htmlFor="s2" className="text-sm text-slate-700">Toggle 2</label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Radio Group</h3>
        <RadioGroup defaultValue="r1">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="r1" id="r1" />
            <label htmlFor="r1" className="text-sm text-slate-700">Radio 1</label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="r2" id="r2" />
            <label htmlFor="r2" className="text-sm text-slate-700">Radio 2</label>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
};
