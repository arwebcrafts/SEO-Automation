# Design System Migration Guide

This guide helps you migrate existing components and code to use the new design system.

## Overview

The new design system introduces:
- **Design tokens** in `src/lib/design-tokens.ts`
- **Updated Tailwind config** with brand, semantic colors, shadows, and border radius
- **Component library** in `src/components/ui/` with Storybook documentation
- **Zero hardcoded colors** policy - all colors must use design tokens

## Migration Steps

### 1. Update Color References

#### Before (Hardcoded Colors)
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white">
  Click me
</button>
```

#### After (Design Tokens)
```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary">Click me</Button>
```

#### Manual Tailwind Updates
If you need to use Tailwind classes directly:

**Before:**
```tsx
<div className="bg-blue-50 border-blue-200 text-blue-900">
  Info message
</div>
```

**After:**
```tsx
<div className="bg-info-50 border-info-200 text-info-800">
  Info message
</div>
```

### 2. Color Mapping Table

| Old Color | New Token | Tailwind Class |
|-----------|-----------|----------------|
| Blue (primary) | Brand | `brand-600` |
| Green (success) | Success | `success-600` |
| Amber/Yellow (warning) | Warning | `warning-600` |
| Red (error) | Error | `error-600` |
| Blue (info) | Info | `info-600` |
| Purple (AI features) | Accent AI | `accentAI-600` (use ONLY for AI) |

### 3. Component Migration

#### Button Migration

**Before:**
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-medium">
  Submit
</button>
```

**After:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary">Submit</Button>
```

**Button Variants:**
- `primary` - Main actions (brand-600)
- `secondary` - Secondary actions (slate-100)
- `outline` - Outlined buttons (brand border)
- `ghost` - Minimal buttons (no background)
- `danger` - Destructive actions (error-600)

**Button Sizes:**
- `sm` - Small buttons (h-8)
- `md` - Medium buttons (h-10) - default
- `lg` - Large buttons (h-12)

#### Input Migration

**Before:**
```tsx
<input 
  className="border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
  placeholder="Enter text"
/>
```

**After:**
```tsx
import { Input } from '@/components/ui/input';

<Input placeholder="Enter text" />
```

**With FormField:**
```tsx
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';

<FormField label="Email" required hint="We'll never share your email">
  <Input type="email" placeholder="you@example.com" />
</FormField>
```

#### Alert Migration

**Before:**
```tsx
<div className="bg-blue-50 border border-blue-200 text-blue-900 rounded p-4">
  Info message
</div>
```

**After:**
```tsx
import { Alert } from '@/components/ui/alert';

<Alert variant="info">Info message</Alert>
```

**Alert Variants:**
- `info` - Informational messages
- `success` - Success messages
- `warning` - Warning messages
- `error` - Error messages

### 4. Shadow Migration

**Before:**
```tsx
<div className="shadow-lg">
  Card content
</div>
```

**After:**
```tsx
<div className="shadow-lg">
  Card content
</div>
```

**New Shadow Tokens:**
- `shadow-xs` - Subtle elevation
- `shadow-sm` - Small cards
- `shadow-md` - Standard cards/buttons
- `shadow-lg` - Dropdowns/modals
- `shadow-xl` - Floating panels/drawers

### 5. Border Radius Migration

**Before:**
```tsx
<div className="rounded-lg">
  Content
</div>
```

**After:**
```tsx
<div className="rounded-lg">
  Content
</div>
```

**New Radius Tokens:**
- `rounded-sm` - 6px - Small elements
- `rounded` / `rounded-md` - 8px - Default
- `rounded-lg` - 12px - Cards
- `rounded-xl` - 16px - Large elements

### 6. Toast Migration

The Toast component has been updated to use design tokens. No code changes needed if you're using the existing `ToastProvider` and `useToast` hook.

**Usage:**
```tsx
import { useToast } from '@/components/ui/Toast';

function MyComponent() {
  const { success, error, warning, info } = useToast();
  
  const handleSuccess = () => {
    success('Success!', 'Your action completed successfully.');
  };
  
  return <button onClick={handleSuccess}>Click me</button>;
}
```

### 7. Common Patterns

#### Card Pattern
```tsx
<div className="bg-white border border-slate-200 rounded-lg shadow-md p-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-2">Card Title</h3>
  <p className="text-slate-600">Card content</p>
</div>
```

#### Badge Pattern
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
```

#### Loading State Pattern
```tsx
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

<Button loading>Processing...</Button>
// or
<Spinner size="md" color="brand" />
```

#### Empty State Pattern
```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

<EmptyState
  title="No items found"
  description="Get started by creating your first item."
  action={<Button variant="primary">Create New</Button>}
/>
```

### 8. Search and Replace Patterns

Use these regex patterns to find and replace hardcoded colors:

**Find:** `bg-blue-600`
**Replace with:** `bg-brand-600`

**Find:** `bg-green-600`
**Replace with:** `bg-success-600`

**Find:** `bg-amber-600`
**Replace with:** `bg-warning-600`

**Find:** `bg-red-600`
**Replace with:** `bg-error-600`

**Find:** `hover:bg-blue-700`
**Replace with:** `hover:bg-brand-700`

**Find:** `focus:ring-blue-500`
**Replace with:** `focus:ring-brand-400`

**Find:** `text-blue-600`
**Replace with:** `text-brand-600`

### 9. Accessibility Improvements

The new components include:
- **forwardRef** for ref forwarding
- **Keyboard navigation** support
- **ARIA attributes** where appropriate
- **Screen reader** friendly labels

### 10. Testing Checklist

After migration, verify:
- [ ] No hardcoded hex colors remain
- [ ] All colors use design tokens
- [ ] Components render correctly in Storybook
- [ ] Dark mode compatibility (if applicable)
- [ ] Keyboard navigation works
- [ ] Screen reader announcements work
- [ ] Hover/focus states use correct colors

### 11. Rollback Plan

If issues arise:
1. Revert the file using git
2. Check the design-tokens.md for correct token usage
3. Review Storybook stories for examples
4. Ask in `#seo-hub-frontend` for help

### 12. Getting Help

- **Storybook**: Run `npm run storybook` to view all components
- **Design Tokens**: See `docs/design-tokens.md`
- **Component Examples**: Check `.stories.tsx` files in `src/components/ui/`
- **Team Channel**: `#seo-hub-frontend`

## Quick Reference

### Import Paths
```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup } from '@/components/ui/radio-group';
import { ToastProvider, useToast } from '@/components/ui/Toast';
```

### Design Token Import
```tsx
import { colors, shadows, borderRadius } from '@/lib/design-tokens';
```

### Utility Function
```tsx
import { cn } from '@/lib/utils';
// Use cn() for className merging
<div className={cn('base-class', condition && 'conditional-class')} />
```

## Migration Status

- **Phase 1**: Design tokens and Tailwind config ✅ Complete
- **Phase 2**: Core UI components ✅ Complete
- **Phase 3**: Existing code migration 🔄 In Progress
- **Phase 4**: Documentation ✅ Complete

Last Updated: 2025
Version: 1.0.0
