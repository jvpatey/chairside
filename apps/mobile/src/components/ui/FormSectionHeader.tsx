import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import {
  DashboardWidgetIconBadge,
  type DashboardWidgetAccent,
} from '@/components/dashboard/DashboardWidgetIconBadge';
import { FormFieldLabel } from '@/components/ui/FormFieldLabel';
import { useThemedStyles } from '@/theme';

type FormSectionHeaderProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: DashboardWidgetAccent;
  required?: boolean;
  hint?: string;
};

/** Section heading for setup forms — square icon badge plus label row. */
export function FormSectionHeader({
  label,
  icon,
  accent = 'tertiary',
  required = false,
  hint,
}: FormSectionHeaderProps) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: hint ? ('flex-start' as const) : ('center' as const),
      gap: spacing.sm,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
      ...(hint ? { paddingTop: 2 } : {}),
    },
    hint: typography.subtitle,
  }));

  return (
    <View style={styles.row} accessibilityRole="header">
      <DashboardWidgetIconBadge icon={icon} accent={accent} />
      <View style={styles.textBlock}>
        <FormFieldLabel label={label} required={required} />
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </View>
  );
}
