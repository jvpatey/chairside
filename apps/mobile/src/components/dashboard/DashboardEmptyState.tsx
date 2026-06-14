import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type DashboardEmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
};

/** Branded empty state for dashboard overview panels. */
export function DashboardEmptyState({ icon, title, message }: DashboardEmptyStateProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, radii, elevation, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.md,
      ...elevation('subtle'),
    },
    motif: {
      width: 72,
      height: 72,
      borderRadius: radii.xxl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
      borderWidth: 1,
      borderColor: isDark ? `${colors.primary}55` : `${colors.primary}33`,
    },
    title: {
      fontSize: 17,
      lineHeight: 22,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
      textAlign: 'center',
      maxWidth: 280,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.motif}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
