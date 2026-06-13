import { Animated, View } from 'react-native';

import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { getDashboardLayoutStyles, dashboardControlRadii } from '@/components/dashboard/dashboardLayout';
import { usePulseOpacity } from '@/lib/motion';
import { useThemedStyles } from '@/theme';

function SkeletonBlock({
  height,
  width,
  borderRadius = 8,
  pulse,
}: {
  height: number;
  width: number | `${number}%`;
  borderRadius?: number;
  pulse: Animated.Value;
}) {
  const styles = useThemedStyles(({ colors }) => ({
    block: {
      height,
      width,
      borderRadius,
      backgroundColor: colors.fillSubtle,
    },
  }));

  return <Animated.View style={[styles.block, { opacity: pulse }]} />;
}

/** Skeleton placeholder matching the dashboard layout rhythm. */
export function DashboardLoadingShell() {
  const pulse = usePulseOpacity();
  const styles = useThemedStyles((theme) => ({
    ...getDashboardLayoutStyles(theme),
    heroBlock: {
      gap: theme.spacing.sm,
      paddingTop: 4,
    },
    quickActionRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.sm,
    },
    tile: {
      flex: 1,
      height: 82,
      borderRadius: dashboardControlRadii.quickAction,
      backgroundColor: theme.colors.fillSubtle,
    },
    statRow: {
      flexDirection: 'row' as const,
      gap: 3,
      padding: 3,
      borderRadius: dashboardControlRadii.statBar,
      backgroundColor: theme.colors.fillSubtle,
    },
    statCell: {
      flex: 1,
      height: 72,
      borderRadius: dashboardControlRadii.statSegment,
      backgroundColor: theme.colors.surface,
    },
    listCard: {
      height: 132,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.fillSubtle,
    },
  }));

  return (
    <View style={styles.content} accessibilityRole="progressbar" accessibilityLabel="Loading dashboard">
      <View style={styles.heroBlock}>
        <SkeletonBlock pulse={pulse} height={16} width="34%" borderRadius={6} />
        <SkeletonBlock pulse={pulse} height={36} width="72%" borderRadius={8} />
        <SkeletonBlock pulse={pulse} height={14} width="28%" borderRadius={6} />
      </View>

      <View style={styles.quickActionSection}>
        <View style={styles.quickActionRow}>
          <Animated.View style={[styles.tile, { opacity: pulse }]} />
          <Animated.View style={[styles.tile, { opacity: pulse }]} />
        </View>
      </View>

      <View style={styles.overviewBlock}>
        <View style={styles.statRow}>
          <Animated.View style={[styles.statCell, { opacity: pulse }]} />
          <Animated.View style={[styles.statCell, { opacity: pulse }]} />
          <Animated.View style={[styles.statCell, { opacity: pulse }]} />
        </View>

        <View style={styles.section}>
          <DashboardSectionHeader title="Open roles near you" />
          <Animated.View style={[styles.listCard, { opacity: pulse }]} />
          <Animated.View style={[styles.listCard, { opacity: pulse }]} />
        </View>
      </View>
    </View>
  );
}
