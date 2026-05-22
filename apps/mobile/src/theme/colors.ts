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
};

export const lightColors: Colors = {
  background: '#FFFFFF',
  backgroundGrouped: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  labelPrimary: '#1C1C1E',
  labelSecondary: '#3C3C4399',
  labelTertiary: '#3C3C434D',
  separator: '#C6C6C8',
  fillSubtle: '#78788014',
  // Brand blue — distinct from system `info`; meets contrast for white label on fills
  primary: '#1A6FD4',
  primaryPressed: '#155EB8',
  primarySubtle: '#E9F2FC',
  primaryOnPrimary: '#FFFFFF',
  secondary: '#5856D6',
  secondaryPressed: '#4A48B8',
  secondarySubtle: '#F0EFFF',
  secondaryOnSecondary: '#FFFFFF',
  success: '#248A3D',
  warning: '#C93400',
  urgent: '#D97706',
  destructive: '#D70015',
  info: '#007AFF',
  tabInactive: '#8E8E93',
};

export const darkColors: Colors = {
  background: '#000000',
  backgroundGrouped: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  labelPrimary: '#FFFFFF',
  labelSecondary: '#EBEBF599',
  labelTertiary: '#EBEBF54D',
  separator: '#38383A',
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
  urgent: '#FFB340',
  destructive: '#FF453A',
  info: '#0A84FF',
  tabInactive: '#636366',
};

export function getColors(scheme: 'light' | 'dark' | null | undefined): Colors {
  return scheme === 'dark' ? darkColors : lightColors;
}
