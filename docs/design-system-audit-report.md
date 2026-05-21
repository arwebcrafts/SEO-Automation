# Design System Migration Audit Report

**Date:** 2025
**Auditor:** Developer 1
**Status:** Complete

## Summary

This audit identifies all instances in the codebase where hardcoded colors are used instead of the new design system tokens. These files need to be migrated to use the new design tokens and components.

## Files Requiring Migration

### High Priority - Core UI Components

#### 1. `src/components/ui/ConfirmationModal.tsx`
**Issues:**
- Uses `bg-blue-100`, `bg-blue-600`, `bg-blue-700` (should use `brand` tokens)
- Uses `bg-green-100`, `bg-green-600`, `bg-green-700` (should use `success` tokens)
- Uses `bg-red-100`, `bg-red-600`, `bg-red-700` (should use `error` tokens)
- Uses `bg-amber-100`, `bg-amber-600`, `bg-amber-700` (should use `warning` tokens)

**Migration Required:** Update color classes to use design tokens

---

#### 2. `src/components/settings/wp-credentials-form.tsx`
**Issues:**
- Line 85: `bg-blue-100` → `bg-brand-100`
- Line 151: Button with `bg-blue-600 hover:bg-blue-700` → Use `Button` component with `variant="primary"`
- Line 199: `bg-blue-50` → `bg-info-50`

**Migration Required:** Replace with `Button` component and design tokens

---

#### 3. `src/components/shared/footer.tsx`
**Issues:**
- Line 70: `hover:bg-blue-600` → `hover:bg-brand-600`

**Migration Required:** Update to use brand tokens

---

#### 4. `src/components/shared/header.tsx`
**Issues:**
- Line 110: `bg-blue-50`, `text-blue-600` → `bg-brand-50`, `text-brand-600`

**Migration Required:** Update to use brand tokens

---

### Medium Priority - Report Components

#### 5. `src/components/report/history-chart.tsx`
**Issues:**
- Line 164: `bg-blue-100`, `text-blue-700` → `bg-brand-100`, `text-brand-700`
- Line 228: `bg-blue-50/50` → `bg-brand-50/50`
- Line 233: `bg-blue-100`, `text-blue-700` → `bg-brand-100`, `text-brand-700`
- Line 256: `bg-blue-50`, `text-blue-600` → `bg-brand-50`, `text-brand-600`
- Line 243-244: Score colors using `bg-green-100`, `bg-amber-100`, `bg-red-100` → Use `success`, `warning`, `error` tokens

**Migration Required:** Update all color classes to design tokens

---

#### 6. `src/components/report/wordpress-connect.tsx`
**Issues:**
- Multiple instances of `bg-green-100`, `bg-green-500`, `bg-green-600`, `bg-green-700` → Use `success` tokens
- Line 267: `bg-green-100`, `text-green-700` → `bg-success-100`, `text-success-700`
- Line 287: `text-green-600`, `bg-green-100/50` → `text-success-600`, `bg-success-100/50`
- Line 359: `bg-green-50`, `border-green-200` → `bg-success-50`, `border-success-200`
- Line 412: `bg-green-500` → `bg-success-500`
- Line 426: Button with `bg-green-600 hover:bg-green-700` → Use `Button` component with custom styling or create success variant
- Line 766, 929, 1100: `bg-green-100` variants → `bg-success-100`
- Line 1399: `bg-green-50` → `bg-success-50`
- Line 280: `text-red-600`, `hover:bg-red-500` → `text-error-600`, `hover:bg-error-500`
- Line 986: `bg-red-100`, `text-red-700` → `bg-error-100`, `text-error-700`

**Migration Required:** Replace with design tokens and `Button` component

---

#### 7. `src/components/report/verification-modal.tsx`
**Issues:**
- Line 34: `bg-green-100`, `text-green-500` → `bg-success-100`, `text-success-600`
- Line 36: `bg-red-100`, `text-red-500` → `bg-error-100`, `text-error-600`
- Line 35: `bg-amber-100`, `text-amber-500` → `bg-warning-100`, `text-warning-600`

**Migration Required:** Update to use semantic tokens

---

#### 8. `src/components/report/recommendation-list.tsx`
**Issues:**
- Line 21: `bg-green-100`, `text-green-700` → `bg-success-100`, `text-success-700`
- Line 19: `bg-red-100`, `text-red-700` → `bg-error-100`, `text-error-700`

**Migration Required:** Update to use semantic tokens

---

#### 9. `src/components/report/pdf-preview-modal.tsx`
**Issues:**
- Line 92: Score function using `bg-green-100`, `bg-amber-100`, `bg-red-100` → Use `success`, `warning`, `error` tokens
- Line 242: `bg-red-100`, `text-red-700` → `bg-error-100`, `text-error-700`
- Line 243: `bg-amber-100`, `text-amber-700` → `bg-warning-100`, `text-warning-700`

**Migration Required:** Update score color logic to use design tokens

---

#### 10. `src/components/report/google-search-console.tsx`
**Issues:**
- Line 250: `bg-amber-50`, `border-amber-200` → `bg-warning-50`, `border-warning-200`

**Migration Required:** Update to use warning tokens

---

#### 11. `src/components/report/check-item.tsx`
**Issues:**
- Line 491: `bg-green-100`, `text-green-600` → `bg-success-100`, `text-success-600`
- Line 491: `bg-amber-100`, `text-amber-600` → `bg-warning-100`, `text-warning-600`
- Line 585: `bg-amber-50`, `border-amber-200` → `bg-warning-50`, `border-warning-200`

**Migration Required:** Update to use semantic tokens

---

## Migration Priority

### Priority 1 - Immediate (Blocking for Design System Adoption)
1. `src/components/ui/ConfirmationModal.tsx` - Core UI component
2. `src/components/settings/wp-credentials-form.tsx` - Settings page

### Priority 2 - High (Report Components)
3. `src/components/report/wordpress-connect.tsx` - Heavy usage of hardcoded colors
4. `src/components/report/history-chart.tsx` - Score indicators
5. `src/components/report/pdf-preview-modal.tsx` - Score indicators

### Priority 3 - Medium (Navigation and Layout)
6. `src/components/shared/footer.tsx` - Hover states
7. `src/components/shared/header.tsx` - Active states

### Priority 4 - Low (Minor Components)
8. `src/components/report/verification-modal.tsx`
9. `src/components/report/recommendation-list.tsx`
10. `src/components/report/google-search-console.tsx`
11. `src/components/report/check-item.tsx`

---

## Migration Strategy

### Step 1: Replace Buttons
Replace all raw `<button>` elements with Tailwind color classes with the new `Button` component:
```tsx
// Before
<button className="bg-blue-600 hover:bg-blue-700 text-white">Submit</button>

// After
import { Button } from '@/components/ui/button';
<Button variant="primary">Submit</Button>
```

### Step 2: Replace Color Classes
Use the following mapping:
- `bg-blue-*` → `bg-brand-*` (primary actions)
- `bg-green-*` → `bg-success-*` (success states)
- `bg-red-*` → `bg-error-*` (error states)
- `bg-amber-*` → `bg-warning-*` (warning states)
- `text-blue-*` → `text-brand-*`
- `text-green-*` → `text-success-*`
- `text-red-*` → `text-error-*`
- `text-amber-*` → `text-warning-*`
- `border-blue-*` → `border-brand-*`
- etc.

### Step 3: Update Score Logic
For score-based color logic (e.g., in charts and modals), create a helper function:
```tsx
const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-success-100 text-success-700';
  if (score >= 60) return 'bg-warning-100 text-warning-700';
  return 'bg-error-100 text-error-700';
};
```

### Step 4: Use Badge Component
Replace color-coded status indicators with the `Badge` component:
```tsx
// Before
<span className="bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>

// After
import { Badge } from '@/components/ui/badge';
<Badge variant="success">Active</Badge>
```

---

## Estimated Effort

- **Priority 1 files:** 2-3 hours
- **Priority 2 files:** 4-5 hours
- **Priority 3 files:** 1-2 hours
- **Priority 4 files:** 2-3 hours

**Total Estimated Time:** 9-13 hours

---

## Next Steps

1. Assign migration tasks to team members based on priority
2. Create feature branches for each file or group of files
3. Run Storybook (`npm run storybook`) to reference correct component usage
4. Test migrated components in the application
5. Update this audit report as migrations are completed

---

## Additional Notes

- All migrated files should be reviewed for accessibility compliance
- Ensure dark mode compatibility is maintained
- Consider creating additional component variants if needed (e.g., success/error button variants)
- Update component stories in Storybook if new patterns emerge

---

**Report Generated By:** Developer 1
**Last Updated:** 2025
