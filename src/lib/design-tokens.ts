/**
 * Design Tokens for SEO Hub
 * 
 * This file exports all design tokens as TypeScript constants.
 * These are used by tailwind.config.ts and can be imported directly in components.
 * 
 * Brand Philosophy:
 * - Primary: Electric Indigo (trust, tech, action)
 * - Accent: Amethyst/Purple (reserved strictly for AI features)
 * - Semantic: Success (emerald), Warning (amber), Error (red)
 * - Neutral: Slate scale for backgrounds and typography
 */

export const colors = {
  // Brand - Primary (Electric Indigo)
  brand: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5', // Primary button color
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
    950: '#1E1B4B',
  },
  
  // Accent - Reserved for AI features only
  accent: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA', // AI generation, sparkles
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
    950: '#3B0764',
  },
  
  // Semantic - Success
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22',
  },
  
  // Semantic - Warning
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },
  
  // Semantic - Error/Danger
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
  
  // Semantic - Info
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },
  
  // Neutral - Slate
  slate: {
    50: '#F8FAFC',  // App background (light)
    100: '#F1F5F9',
    200: '#E2E8F0', // Borders (light)
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B', // Secondary text
    600: '#475569',
    700: '#334155',
    800: '#1E293B', // Card surface (dark)
    900: '#0F172A', // Primary text (light)
    950: '#020617', // App background (dark)
  },
} as const;

export const shadows = {
  xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
  sm: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
  md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
  lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
  xl: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
} as const;

export const borderRadius = {
  sm: '6px',
  DEFAULT: '8px',
  md: '8px',
  lg: '12px',
  xl: '16px',
} as const;

export const typography = {
  fontSize: {
    xs: '0.75rem',      // 12px - labels, kicker
    sm: '0.875rem',     // 14px - body
    base: '1rem',       // 16px - body
    lg: '1.125rem',     // 18px - H3
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px - H2
    '3xl': '1.875rem',  // 30px - H1
    '4xl': '2.25rem',   // 36px - display
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
} as const;

export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Type exports for TypeScript
export type ColorShade = keyof typeof colors.brand;
export type ShadowSize = keyof typeof shadows;
export type RadiusSize = keyof typeof borderRadius;
