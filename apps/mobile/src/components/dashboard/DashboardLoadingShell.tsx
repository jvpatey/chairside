import { View } from 'react-native';

import { ShimmerBlock } from '@/components/dashboard/ShimmerBlock';
import { getDashboardLayoutStyles, dashboardControlRadii } from '@/components/dashboard/dashboardLayout';
import { useThemedStyles } from '@/theme';

/** Skeleton placeholder matching the workstation dashboard layout rhythm. */
export function DashboardLoadingShell() {
  const styles = useThemedStyles((theme) => ({
    ...getDashboardLayoutStyles(theme),
    heroBlock: {
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    attentionNextUpRow: {
      ...getDashboardLayoutStyles(theme).attentionNextUpRow,
    },
    attentionNextUpStack: {
      ...getDashboardLayoutStyles(theme).attentionNextUpStack,
    },
    nextUpCard: {
      height: 88,
      borderRadius: theme.radii.xl,
      flex: 1,
      minWidth: 160,
    },
    workspaceWell: {
      borderRadius: theme.radii.hero,
      overflow: 'hidden',
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      backgroundColor: theme.colors.fillSubtle,
    },
    tabRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.sm,
    },
    tab: {
      height: 32,
      flex: 1,
      borderRadius: theme.radii.md,
    },
    quickActionRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.md,
    },
    tile: {
      flex: 1,
      height: 88,
      borderRadius: dashboardControlRadii.quickAction,
    },
    listCard: {
      height: 120,
      borderRadius: theme.radii.lg,
    },
  }));

  return (
    <View style={styles.content} accessibilityRole="progressbar" accessibilityLabel="Loading dashboard">
      <View style={styles.heroBlock}>
        <ShimmerBlock height={14} width="24%" borderRadius={6} />
        <ShimmerBlock height={32} width="68%" borderRadius={8} />
        <ShimmerBlock height={14} width="36%" borderRadius={6} />
      </View>

      <View style={styles.quickActionSection}>
        <View style={styles.quickActionRow}>
          <ShimmerBlock height={88} width="100%" borderRadius={22} style={styles.tile} />
          <ShimmerBlock height={88} width="100%" borderRadius={22} style={styles.tile} />
        </View>
      </View>

      <View style={styles.attentionNextUpStack}>
        <View style={styles.attentionNextUpRow}>
          <ShimmerBlock height={88} width="100%" borderRadius={16} style={styles.nextUpCard} />
          <ShimmerBlock height={88} width="100%" borderRadius={16} style={styles.nextUpCard} />
        </View>
      </View>

      <View style={styles.workspaceWell}>
        <View style={styles.tabRow}>
          <ShimmerBlock height={32} width="100%" borderRadius={12} style={styles.tab} />
          <ShimmerBlock height={32} width="100%" borderRadius={12} style={styles.tab} />
          <ShimmerBlock height={32} width="100%" borderRadius={12} style={styles.tab} />
        </View>
        <ShimmerBlock height={120} width="100%" borderRadius={16} style={styles.listCard} />
        <ShimmerBlock height={120} width="100%" borderRadius={16} style={styles.listCard} />
      </View>
    </View>
  );
}
