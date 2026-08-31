export const lightColors = {
  primary: '#5B4BE0',
  primaryMuted: '#EEECFC',
  secondary: '#0F172A',
  accent: '#22D3EE',
  background: '#FBFBFD',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  textPrimary: '#16161D',
  textSecondary: '#6B7280',
  textDim: '#9AA0AA',
  border: '#EAEAEF',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#E5484D',
  overlay: 'rgba(11,11,16,0.45)',
  // Foreground on always-saturated surfaces (Create pill / gradient). Constant across schemes.
  onPrimary: '#FFFFFF',
  gradientCreate: ['#5B4BE0', '#22D3EE'] as const,
};

export const darkColors: typeof lightColors = {
  primary: '#8B7DF0',
  primaryMuted: '#23204A',
  secondary: '#E2E8F0',
  accent: '#22D3EE',
  background: '#0B0B10',
  surface: '#15151D',
  card: '#1B1B25',
  textPrimary: '#F5F5F7',
  textSecondary: '#9AA0AA',
  textDim: '#6B7280',
  border: '#2A2A36',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  overlay: 'rgba(0,0,0,0.6)',
  onPrimary: '#FFFFFF',
  gradientCreate: ['#5B4BE0', '#22D3EE'] as const,
};

export type ColorTokens = typeof lightColors;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export type Scheme = 'light' | 'dark';

export function shadow(scheme: Scheme) {
  return {
    shadowColor: '#0F0F19',
    shadowOpacity: scheme === 'light' ? 0.08 : 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  };
}

export const colorsFor = (scheme: Scheme): ColorTokens =>
  scheme === 'dark' ? darkColors : lightColors;
