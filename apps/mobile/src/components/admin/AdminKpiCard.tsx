import { StyleSheet, Text, View } from 'react-native';

import { colorWithAlpha, fontBold, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type AdminKpiCardProps = {
  label: string;
  value: number;
  accent: 'primary' | 'secondary' | 'tertiary' | 'warning';
  hint?: string;
};

export function AdminKpiCard({ label, value, accent, hint }: AdminKpiCardProps) {
  const { colors } = useTheme();
  const accentColor = colors[accent];

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      flex: 1,
      minWidth: 160,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderLeftWidth: 4,
      gap: spacing.xs,
    },
    label: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.labelSecondary,
      letterSpacing: 0.2,
    },
    value: {
      fontFamily: fontBold,
      fontSize: 36,
      lineHeight: 40,
      color: colors.labelPrimary,
      letterSpacing: -0.8,
    },
    hint: {
      fontFamily: fontSemibold,
      fontSize: 12,
      color: colors.labelTertiary,
      marginTop: 2,
    },
  }));

  return (
    <View
      style={[
        styles.card,
        {
          borderLeftColor: accentColor,
          backgroundColor: colorWithAlpha(accentColor, 0.06),
        },
      ]}
      accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value.toLocaleString()}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
