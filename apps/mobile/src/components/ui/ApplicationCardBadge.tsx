import { PillBadge } from '@/components/ui/PillBadge';
import { resolveAccentColor, resolveAccentOnColor } from '@/lib/accentColors';
import { useTheme, type GradientAccent } from '@/theme';

type ApplicationCardBadgeProps = {
  label?: string;
  accent?: GradientAccent;
};

export function ApplicationCardBadge({ label, accent = 'tertiary' }: ApplicationCardBadgeProps) {
  const { colors } = useTheme();
  const backgroundColor = resolveAccentColor(colors, accent);
  const color = resolveAccentOnColor(colors, accent);

  return (
    <PillBadge
      label={label ?? 'New'}
      color={color}
      backgroundColor={backgroundColor}
      size="sm"
      accessibilityLabel={label ?? 'Unread application update'}
    />
  );
}
