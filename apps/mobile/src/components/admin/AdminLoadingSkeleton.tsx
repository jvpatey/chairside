import { Text, View } from 'react-native';

import { ChairsideBrandText } from '@/components/brand/ChairsideWordmark';
import { ShimmerBlock } from '@/components/dashboard/ShimmerBlock';
import { fontBold, useThemedStyles } from '@/theme';

type AdminLoadingSkeletonProps = {
  compact?: boolean;
};

export function AdminLoadingSkeleton({ compact = false }: AdminLoadingSkeletonProps) {
  const titleSize = compact ? 24 : 28;
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    root: {
      gap: spacing.lg,
    },
    title: {
      fontFamily: fontBold,
      color: colors.labelPrimary,
      marginBottom: spacing.sm,
    },
    titleSuffix: {
      fontFamily: fontBold,
      color: colors.labelPrimary,
    },
    kpiRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    kpi: {
      flexGrow: 1,
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
    mid: {
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    panel: {
      flex: 1,
      height: 220,
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
    table: {
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
  }));

  return (
    <View
      style={[styles.root, compact && { gap: 12 }]}
      accessibilityLabel="Loading admin stats">
      <Text style={[styles.title, { fontSize: titleSize }]}>
        <ChairsideBrandText variant="inherit" />
        <Text style={[styles.titleSuffix, { fontSize: titleSize }]}> Statistics</Text>
      </Text>
      <View style={styles.kpiRow}>
        {[0, 1, 2, 3].map((key) => (
          <View
            key={key}
            style={[
              styles.kpi,
              {
                flexBasis: compact ? '47%' : 160,
                minWidth: compact ? 140 : 160,
                height: compact ? 96 : 110,
              },
            ]}>
            <ShimmerBlock height={compact ? 96 : 110} width="100%" borderRadius={20} />
          </View>
        ))}
      </View>
      <View style={[styles.mid, { flexDirection: compact ? 'column' : 'row' }]}>
        <View
          style={[
            styles.panel,
            {
              minWidth: compact ? 0 : 280,
              width: compact ? '100%' : undefined,
            },
          ]}>
          <ShimmerBlock height={220} width="100%" borderRadius={20} />
        </View>
        <View
          style={[
            styles.panel,
            {
              minWidth: compact ? 0 : 280,
              width: compact ? '100%' : undefined,
            },
          ]}>
          <ShimmerBlock height={220} width="100%" borderRadius={20} />
        </View>
      </View>
      <View style={[styles.table, { height: compact ? 260 : 320 }]}>
        <ShimmerBlock height={compact ? 260 : 320} width="100%" borderRadius={20} />
      </View>
    </View>
  );
}
