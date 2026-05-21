# Design Tokens

This document defines the design system tokens for SEO Hub. All components must use these tokens instead of hardcoded values.

## Table of Contents

- [Color Philosophy](#color-philosophy)
- [Brand Colors](#brand-colors)
- [Accent Colors](#accent-colors)
- [Semantic Colors](#semantic-colors)
- [Shadows](#shadows)
- [Border Radius](#border-radius)
- [Typography](#typography)
- [Spacing](#spacing)
- [Animation](#animation)
- [Usage Guidelines](#usage-guidelines)

## Color Philosophy

### Brand - Primary (Electric Indigo)
- **Purpose**: Primary actions, brand identity, navigation
- **Usage**: Main buttons, links, active states, brand elements
- **Tailwind**: `brand-50` through `brand-950`
- **Primary button**: `bg-brand-600 hover:bg-brand-700`

### Accent - Amethyst (AI Features Only)
- **Purpose**: Strictly reserved for AI-powered features
- **Usage**: AI generation, sparkles, magic effects, AI badges
- **Tailwind**: `accentAI-50` through `accentAI-950`
- **AI elements**: `bg-accentAI-600 hover:bg-accentAI-700`
- **⚠️ WARNING**: Never use for non-AI features

### Semantic Colors

#### Success (Emerald)
- **Purpose**: Positive states, successful operations
- **Usage**: Success messages, completed states, positive metrics
- **Tailwind**: `success-50` through `success-950`

#### Warning (Amber)
- **Purpose**: Cautionary states, warnings
- **Usage**: Warning messages, pending states, attention needed
- **Tailwind**: `warning-50` through `warning-950`

#### Error/Danger (Red)
- **Purpose**: Negative states, destructive actions
- **Usage**: Error messages, failed states, delete actions
- **Tailwind**: `error-50` through `error-950`

#### Info (Blue)
- **Purpose**: Informational states
- **Usage**: Info messages, tips, neutral highlights
- **Tailwind**: `info-50` through `info-950`

## Brand Colors

### Electric Indigo Scale

| Token | Value | Usage |
|-------|-------|-------|
| `brand-50` | `#EEF2FF` | Very light backgrounds, subtle highlights |
| `brand-100` | `#E0E7FF` | Light backgrounds, hover states |
| `brand-200` | `#C7D2FE` | Subtle borders, light accents |
| `brand-300` | `#A5B4FC` | Light text, disabled states |
| `brand-400` | `#818CF8` | Secondary actions, links |
| `brand-500` | `#6366F1` | Standard brand color |
| `brand-600` | `#4F46E5` | **Primary buttons**, main actions |
| `brand-700` | `#4338CA` | Primary button hover, dark backgrounds |
| `brand-800` | `#3730A3` | Dark accents, night mode |
| `brand-900` | `#312E81` | Very dark backgrounds |
| `brand-950` | `#1E1B4B` | Deepest backgrounds |

## Accent Colors (AI Only)

### Amethyst Scale

| Token | Value | Usage |
|-------|-------|-------|
| `accentAI-50` | `#FAF5FF` | AI section backgrounds |
| `accentAI-100` | `#F3E8FF` | AI hover states |
| `accentAI-200` | `#E9D5FF` | AI borders |
| `accentAI-300` | `#D8B4FE` | AI text hints |
| `accentAI-400` | `#C084FC` | AI secondary elements |
| `accentAI-500` | `#A855F7` | AI standard color |
| `accentAI-600` | `#9333EA` | **AI buttons**, generation states |
| `accentAI-700` | `#7E22CE` | AI button hover |
| `accentAI-800` | `#6B21A8` | AI dark mode |
| `accentAI-900` | `#581C87` | AI very dark |
| `accentAI-950` | `#3B0764` | AI deepest |

## Semantic Colors

### Success (Emerald)

| Token | Value | Usage |
|-------|-------|-------|
| `success-50` | `#ECFDF5` | Success backgrounds |
| `success-100` | `#D1FAE5` | Light success |
| `success-200` | `#A7F3D0` | Success borders |
| `success-500` | `#10B981` | Success indicators |
| `success-600` | `#059669` | Success text, icons |
| `success-700` | `#047857` | Dark success |

### Warning (Amber)

| Token | Value | Usage |
|-------|-------|-------|
| `warning-50` | `#FFFBEB` | Warning backgrounds |
| `warning-100` | `#FEF3C7` | Light warning |
| `warning-200` | `#FDE68A` | Warning borders |
| `warning-500` | `#F59E0B` | Warning indicators |
| `warning-600` | `#D97706` | Warning text, icons |
| `warning-700` | `#B45309` | Dark warning |

### Error (Red)

| Token | Value | Usage |
|-------|-------|-------|
| `error-50` | `#FEF2F2` | Error backgrounds |
| `error-100` | `#FEE2E2` | Light error |
| `error-200` | `#FECACA` | Error borders |
| `error-500` | `#EF4444` | Error indicators |
| `error-600` | `#DC2626` | Error text, icons |
| `error-700` | `#B91C1C` | Dark error |

### Info (Blue)

| Token | Value | Usage |
|-------|-------|-------|
| `info-50` | `#EFF6FF` | Info backgrounds |
| `info-100` | `#DBEAFE` | Light info |
| `info-200` | `#BFDBFE` | Info borders |
| `info-500` | `#3B82F6` | Info indicators |
| `info-600` | `#2563EB` | Info text, icons |
| `info-700` | `#1D4ED8` | Dark info |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-xs` | `0 1px 2px rgba(15, 23, 42, 0.04)` | Subtle elevation, tooltips |
| `shadow-sm` | `0 1px 3px rgba(15, 23, 42, 0.06)` | Small cards, badges |
| `shadow-md` | `0 4px 6px -1px rgba(15, 23, 42, 0.08)` | Standard cards, buttons |
| `shadow-lg` | `0 10px 15px -3px rgba(15, 23, 42, 0.08)` | Dropdowns, modals |
| `shadow-xl` | `0 20px 25px -5px rgba(15, 23, 42, 0.08)` | Floating panels, drawers |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | `6px` | Small elements, tags |
| `rounded` / `rounded-md` | `8px` | Default, most components |
| `rounded-lg` | `12px` | Cards, panels |
| `rounded-xl` | `16px` | Large cards, hero elements |

## Typography

### Font Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `text-xs` | `12px` | Labels, kickers, metadata |
| `text-sm` | `14px` | Body text, descriptions |
| `text-base` | `16px` | Default body text |
| `text-lg` | `18px` | H3 headings |
| `text-xl` | `20px` | Subheadings |
| `text-2xl` | `24px` | H2 headings |
| `text-3xl` | `30px` | H1 headings |
| `text-4xl` | `36px` | Display headings |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-normal` | `400` | Body text |
| `font-medium` | `500` | Emphasized text |
| `font-semibold` | `600` | Headings, labels |
| `font-bold` | `700` | Strong headings |
| `font-extrabold` | `800` | Display headings |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `leading-tight` | `1.25` | Headings, compact text |
| `leading-normal` | `1.5` | Body text (default) |
| `leading-relaxed` | `1.75` | Long-form content |

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` / `p-2` | `8px` | Tight spacing |
| `space-sm` / `p-3` | `12px` | Small spacing |
| `space-md` / `p-4` | `16px` | Default spacing |
| `space-lg` / `p-6` | `24px` | Large spacing |
| `space-xl` / `p-8` | `32px` | Extra large spacing |
| `space-2xl` / `p-12` | `48px` | Section spacing |

## Animation

### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | `150ms` | Quick transitions, hover |
| `duration-normal` | `200ms` | Standard transitions |
| `duration-slow` | `300ms` | Slow transitions, modals |

### Easing

| Token | Value | Usage |
|-------|-------|-------|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Entrance animations |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Exit animations |
| `ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Bouncy effects |

## Usage Guidelines

### ✅ DO

- Use design tokens for all colors, spacing, shadows, and typography
- Reference `src/lib/design-tokens.ts` for token values
- Use semantic colors for their intended purposes
- Reserve `accentAI` colors exclusively for AI features
- Use appropriate shadow levels based on elevation

### ❌ DON'T

- Never use hardcoded hex colors (e.g., `#4F46E5`)
- Never use `accentAI` colors for non-AI features
- Never use random colors from the slate scale without purpose
- Never mix semantic colors incorrectly (e.g., error for success)
- Never skip using design tokens for consistency

### Tailwind Examples

```tsx
// ✅ Correct - using design tokens
<button className="bg-brand-600 hover:bg-brand-700 text-white rounded-md shadow-md">
  Primary Action
</button>

<Alert variant="success" className="bg-success-50 border-success-200 text-success-700">
  Success message
</Alert>

// ❌ Incorrect - hardcoded colors
<button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
  Primary Action
</button>
```

### Importing Tokens in TypeScript

```tsx
import { colors, shadows, borderRadius } from '@/lib/design-tokens';

// Use in styled-components or CSS-in-JS
const buttonStyle = {
  backgroundColor: colors.brand[600],
  boxShadow: shadows.md,
  borderRadius: borderRadius.md,
};
```

## Token Version

- **Version**: 1.0.0
- **Last Updated**: 2025
- **Status**: Frozen (Sprint 1, Day 1)

## Migration Notes

When migrating existing code:
1. Replace all hardcoded hex colors with design tokens
2. Update Tailwind classes to use new color scales
3. Replace arbitrary values with semantic tokens
4. Test dark mode compatibility
5. Ensure accessibility ratios are maintained

See [Migration Guide](./migration-guide.md) for detailed steps.
