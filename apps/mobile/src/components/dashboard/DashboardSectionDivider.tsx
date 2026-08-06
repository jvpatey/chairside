import { StyleSheet, View } from 'react-native';

import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { useThemedStyles } from '@/theme';

/** Subtle rule between dashboard sections. */
export function DashboardSectionDivider() {
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
      backgroundColor: theme.colors.separator,
    },
  }));

  return (
    <View
      style={styles.wrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={styles.line} />
    </View>
  );
}
