import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { getDashboardSectionDividerGradient, useTheme, useThemedStyles } from '@/theme';

/** Subtle brand-tinted rule between dashboard quick actions and stat cards. */
export function DashboardSectionDivider() {
  const { colors, isDark } = useTheme();
  const gradient = getDashboardSectionDividerGradient(colors, isDark);
  const styles = useThemedStyles((theme) => ({
    ...getDashboardLayoutStyles(theme),
    wrap: {
      width: '100%',
      alignSelf: 'stretch' as const,
      paddingVertical: theme.spacing.xs,
      marginTop: -theme.spacing.sm,
      marginBottom: -theme.spacing.sm,
    },
    line: {
      height: StyleSheet.hairlineWidth,
      width: '100%',
      borderRadius: 1,
      overflow: 'hidden' as const,
    },
  }));

  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient
        colors={gradient}
        locations={[0, 0.22, 0.5, 0.78, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
    </View>
  );
}
