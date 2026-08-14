export type Colors = {
  background: string;
  backgroundGrouped: string;
  surface: string;
  surfaceElevated: string;
  labelPrimary: string;
  labelSecondary: string;
  labelTertiary: string;
  separator: string;
  fillSubtle: string;
  primary: string;
  primaryPressed: string;
  primarySubtle: string;
  primaryOnPrimary: string;
  secondary: string;
  secondaryPressed: string;
  secondarySubtle: string;
  secondaryOnSecondary: string;
  success: string;
  warning: string;
  urgent: string;
  destructive: string;
  info: string;
  tabInactive: string;
  /** Mint — applications pipeline, live, confirmed, healthy, positive deltas */
  tertiary: string;
  tertiaryPressed: string;
  tertiarySubtle: string;
  tertiaryOnTertiary: string;
};

export const lightColors: Colors = {
  background: '#FFFFFF',
  backgroundGrouped: '#EDF0F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  labelPrimary: '#0E1B2C',
  // Brand-temperature neutrals — alphas tuned for AA body text on white/grouped
  labelSecondary: '#3C485CC2',
  labelTertiary: '#3C485C80',
  separator: '#0E1B2C0D',
  fillSubtle: '#3C485C14',
  // Brand blue — roles / primary actions
  primary: '#1A6FD4',
  primaryPressed: '#155EB8',
  primarySubtle: '#D6E8FA',
  primaryOnPrimary: '#FFFFFF',
  // Purple — fill-ins only
  secondary: '#5856D6',
  secondaryPressed: '#4A48B8',
  secondarySubtle: '#E6E4FF',
  secondaryOnSecondary: '#FFFFFF',
  success: '#248A3D',
  // Amber warning (distinct from destructive red)
  warning: '#B45309',
  // Same hue as warning — use filled vs tonal badge treatments, not a third color
  urgent: '#B45309',
  destructive: '#D70015',
  // Alias of primary — do not introduce a second blue
  info: '#1A6FD4',
  tabInactive: '#6B7589',
  tertiary: '#0F9F8A',
  tertiaryPressed: '#0C8775',
  tertiarySubtle: '#D4F5EF',
  tertiaryOnTertiary: '#FFFFFF',
};

export const darkColors: Colors = {
  background: '#0B0D12',
  backgroundGrouped: '#0E1016',
  surface: '#14161D',
  surfaceElevated: '#1B1E27',
  labelPrimary: '#FFFFFF',
  labelSecondary: '#E5EAF599',
  labelTertiary: '#E5EAF54D',
  separator: '#FFFFFF0A',
  fillSubtle: '#78788024',
  primary: '#4A9AFF',
  primaryPressed: '#3588F0',
  primarySubtle: '#1A2D47',
  primaryOnPrimary: '#FFFFFF',
  secondary: '#9896FF',
  secondaryPressed: '#7B79E6',
  secondarySubtle: '#2A2650',
  secondaryOnSecondary: '#FFFFFF',
  success: '#30D158',
  warning: '#FF9F0A',
  // Same hue family as warning — treatment differs in components, not hue
  urgent: '#FF9F0A',
  destructive: '#FF453A',
  info: '#4A9AFF',
  tabInactive: '#636366',
  tertiary: '#34D399',
  tertiaryPressed: '#2BB88A',
  tertiarySubtle: '#123528',
  tertiaryOnTertiary: '#FFFFFF',
};

export function getColors(scheme: 'light' | 'dark' | null | undefined): Colors {
  return scheme === 'dark' ? darkColors : lightColors;
}
