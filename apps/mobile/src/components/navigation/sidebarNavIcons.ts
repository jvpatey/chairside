import { resolveAccentColor } from '@/lib/accentColors';
import { colorWithAlpha, type Colors, type GradientAccent } from '@/theme';

/** Sidebar nav icons use lane color directly — no icon well background. */
export function getSidebarNavIconColor(
  colors: Colors,
  accent: GradientAccent,
  active: boolean,
): string {
  const accentColor = resolveAccentColor(colors, accent);
  return active ? accentColor : colorWithAlpha(accentColor, 0.55);
}
