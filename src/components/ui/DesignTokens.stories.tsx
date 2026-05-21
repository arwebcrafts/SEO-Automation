import type { Meta, StoryObj } from '@storybook/react';
import { colors, shadows, borderRadius, typography } from '@/lib/design-tokens';

const meta: Meta = {
  title: 'Design System/Tokens',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj;

export const BrandColors: Story = {
  render: () => (
    <div className="p-8 space-y-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-slate-900">Brand Colors - Electric Indigo</h1>
      <p className="text-slate-600">Primary actions, brand identity, navigation</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(colors.brand).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <div 
              className="h-20 w-full rounded-lg shadow-sm border border-slate-200"
              style={{ backgroundColor: value }}
            />
            <div className="text-sm font-medium text-slate-900">{key}</div>
            <div className="text-xs text-slate-500 font-mono">{value}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const AccentColors: Story = {
  render: () => (
    <div className="p-8 space-y-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-slate-900">Accent Colors - AI Features Only</h1>
      <p className="text-slate-600">
        <span className="text-error-600 font-semibold">⚠️ WARNING:</span> Strictly reserved for AI-powered features
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(colors.accent).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <div
              className="h-20 w-full rounded-lg shadow-sm border border-slate-200"
              style={{ backgroundColor: value as string }}
            />
            <div className="text-sm font-medium text-slate-900">{key}</div>
            <div className="text-xs text-slate-500 font-mono">{value as string}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const SemanticColors: Story = {
  render: () => (
    <div className="p-8 space-y-12 max-w-6xl">
      {/* Success */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Success - Emerald</h2>
        <p className="text-slate-600 mb-6">Positive states, successful operations</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(colors.success).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div 
                className="h-20 w-full rounded-lg shadow-sm border border-slate-200"
                style={{ backgroundColor: value }}
              />
              <div className="text-sm font-medium text-slate-900">{key}</div>
              <div className="text-xs text-slate-500 font-mono">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Warning - Amber</h2>
        <p className="text-slate-600 mb-6">Cautionary states, warnings</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(colors.warning).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div 
                className="h-20 w-full rounded-lg shadow-sm border border-slate-200"
                style={{ backgroundColor: value }}
              />
              <div className="text-sm font-medium text-slate-900">{key}</div>
              <div className="text-xs text-slate-500 font-mono">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Error - Red</h2>
        <p className="text-slate-600 mb-6">Negative states, destructive actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(colors.danger).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div
                className="h-20 w-full rounded-lg shadow-sm border border-slate-200"
                style={{ backgroundColor: value as string }}
              />
              <div className="text-sm font-medium text-slate-900">{key}</div>
              <div className="text-xs text-slate-500 font-mono">{value as string}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Info - Blue</h2>
        <p className="text-slate-600 mb-6">Informational states</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(colors.info).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div 
                className="h-20 w-full rounded-lg shadow-sm border border-slate-200"
                style={{ backgroundColor: value }}
              />
              <div className="text-sm font-medium text-slate-900">{key}</div>
              <div className="text-xs text-slate-500 font-mono">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Shadows: Story = {
  render: () => (
    <div className="p-8 space-y-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-slate-900">Shadows</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {Object.entries(shadows).map(([key, value]) => (
          <div key={key} className="space-y-4">
            <div 
              className="h-32 w-full bg-white rounded-lg p-4 flex items-center justify-center"
              style={{ boxShadow: value }}
            >
              <span className="text-sm font-medium text-slate-700">{key}</span>
            </div>
            <div className="text-sm font-medium text-slate-900">{key}</div>
            <div className="text-xs text-slate-500 font-mono break-all">{value}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <div className="p-8 space-y-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-slate-900">Border Radius</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {Object.entries(borderRadius).map(([key, value]) => (
          <div key={key} className="space-y-4">
            <div 
              className="h-32 w-full bg-brand-500 p-4 flex items-center justify-center"
              style={{ borderRadius: value }}
            >
              <span className="text-sm font-medium text-white">{key}</span>
            </div>
            <div className="text-sm font-medium text-slate-900">{key}</div>
            <div className="text-xs text-slate-500 font-mono">{value}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="p-8 space-y-12 max-w-6xl">
      <h1 className="text-3xl font-bold text-slate-900">Typography</h1>
      
      {/* Font Sizes */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Font Sizes</h2>
        <div className="space-y-4">
          {Object.entries(typography.fontSize).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <span 
                className="text-slate-900"
                style={{ fontSize: value }}
              >
                {key} - {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Font Weights */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Font Weights</h2>
        <div className="space-y-4">
          {Object.entries(typography.fontWeight).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <span 
                className="text-slate-900 text-base"
                style={{ fontWeight: value }}
              >
                {key} - {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Line Heights */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Line Heights</h2>
        <div className="space-y-4">
          {Object.entries(typography.lineHeight).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <span 
                className="text-slate-900 text-base"
                style={{ lineHeight: value }}
              >
                {key} - {value} - The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const AllTokens: Story = {
  render: () => (
    <div className="p-8 space-y-16 max-w-6xl">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Design Tokens Overview</h1>
      <p className="text-lg text-slate-600">Complete reference for SEO Hub design system</p>
      
      <BrandColors.render />
      <AccentColors.render />
      <SemanticColors.render />
      <Shadows.render />
      <BorderRadius.render />
      <Typography.render />
    </div>
  ),
};
