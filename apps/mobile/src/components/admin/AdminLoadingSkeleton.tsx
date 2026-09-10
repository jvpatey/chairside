import { StyleSheet, Text, View } from 'react-native';

import { ChairsideBrandText } from '@/components/brand/ChairsideWordmark';
import { ShimmerBlock } from '@/components/dashboard/ShimmerBlock';
import { fontBold, useThemedStyles } from '@/theme';

export function AdminLoadingSkeleton() {
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    root: {
      gap: spacing.lg,
    },
    title: {
      fontFamily: fontBold,
      fontSize: 28,
      color: colors.labelPrimary,
      marginBottom: spacing.sm,
    },
    titleSuffix: {
      fontFamily: fontBold,
      fontSize: 28,
      color: colors.labelPrimary,
    },
    kpiRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    kpi: {
      flex: 1,
      minWidth: 160,
      height: 110,
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
    mid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    panel: {
      flex: 1,
      minWidth: 280,
      height: 260,
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
    table: {
      height: 320,
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
  }));

  return (
    <View style={styles.root} accessibilityLabel="Loading admin stats">
      <Text style={styles.title}>
        <ChairsideBrandText variant="inherit" />
        <Text style={styles.titleSuffix}> Statistics</Text>
      </Text>
      <View style={styles.kpiRow}>
        {[0, 1, 2, 3].map((key) => (
          <View key={key} style={styles.kpi}>
            <ShimmerBlock height={110} width="100%" borderRadius={20} />
          </View>
        ))}
      </View>
      <View style={styles.mid}>
        <View style={styles.panel}>
          <ShimmerBlock height={260} width="100%" borderRadius={20} />
        </View>
        <View style={styles.panel}>
          <ShimmerBlock height={260} width="100%" borderRadius={20} />
        </View>
      </View>
      <View style={styles.table}>
        <ShimmerBlock height={320} width="100%" borderRadius={20} />
      </View>
    </View>
  );
}
