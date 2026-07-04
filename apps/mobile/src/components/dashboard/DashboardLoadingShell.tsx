import { View } from 'react-native';

import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { ShimmerBlock } from '@/components/dashboard/ShimmerBlock';
import { getDashboardLayoutStyles, dashboardControlRadii } from '@/components/dashboard/dashboardLayout';
import { useThemedStyles } from '@/theme';

/** Skeleton placeholder matching the premium dashboard layout rhythm. */
export function DashboardLoadingShell() {
  const styles = useThemedStyles((theme) => ({
    ...getDashboardLayoutStyles(theme),
    heroBlock: {
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    heroBand: {
      borderRadius: theme.radii.hero,
      overflow: 'hidden',
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.fillSubtle,
    },
    quickActionRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.md,
    },
    statRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.sm,
    },
    statCell: {
      flex: 1,
      height: 96,
      borderRadius: theme.radii.lg,
    },
    spotlight: {
      height: 128,
      borderRadius: theme.radii.xl,
    },
    tile: {
      flex: 1,
      height: 96,
      borderRadius: dashboardControlRadii.quickAction,
    },
    listCard: {
      height: 132,
      borderRadius: theme.radii.lg,
    },
  }));

  return (
    <View style={styles.content} accessibilityRole="progressbar" accessibilityLabel="Loading dashboard">
      <View style={styles.heroBlock}>
        <View style={styles.heroBand}>
          <ShimmerBlock height={14} width="28%" borderRadius={6} />
          <ShimmerBlock height={40} width="76%" borderRadius={10} />
          <ShimmerBlock height={16} width="42%" borderRadius={6} />
        </View>
      </View>

      <ShimmerBlock height={128} width="100%" borderRadius={18} style={styles.spotlight} />

      <View style={styles.statRow}>
        <ShimmerBlock height={96} width="100%" borderRadius={16} style={styles.statCell} />
        <ShimmerBlock height={96} width="100%" borderRadius={16} style={styles.statCell} />
        <ShimmerBlock height={96} width="100%" borderRadius={16} style={styles.statCell} />
      </View>

      <View style={styles.quickActionSection}>
        <View style={styles.quickActionRow}>
          <ShimmerBlock height={96} width="100%" borderRadius={22} style={styles.tile} />
          <ShimmerBlock height={96} width="100%" borderRadius={22} style={styles.tile} />
        </View>
      </View>

      <View style={styles.overviewBlock}>
        <View style={styles.section}>
          <DashboardSectionHeader title="Overview" />
          <ShimmerBlock height={132} width="100%" borderRadius={16} style={styles.listCard} />
          <ShimmerBlock height={132} width="100%" borderRadius={16} style={styles.listCard} />
        </View>
      </View>
    </View>
  );
}
