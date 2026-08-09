import type { Colors } from '@/theme/colors';
import type { GradientAccent } from '@/theme/gradients';

export function resolveAccentColor(colors: Colors, accent: GradientAccent = 'primary'): string {
  if (accent === 'tertiary') return colors.tertiary;
  return accent === 'secondary' ? colors.secondary : colors.primary;
}

export function resolveAccentSubtle(colors: Colors, accent: GradientAccent = 'primary'): string {
  if (accent === 'tertiary') return colors.tertiarySubtle;
  return accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
}

export function resolveAccentOnColor(colors: Colors, accent: GradientAccent = 'primary'): string {
  if (accent === 'tertiary') return colors.tertiaryOnTertiary;
  return accent === 'secondary' ? colors.secondaryOnSecondary : colors.primaryOnPrimary;
}

export function resolveAccentPressed(colors: Colors, accent: GradientAccent = 'primary'): string {
  if (accent === 'tertiary') return colors.tertiaryPressed;
  return accent === 'secondary' ? colors.secondaryPressed : colors.primaryPressed;
}
