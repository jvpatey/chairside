import { View } from 'react-native';

import { ShimmerBlock } from '@/components/dashboard/ShimmerBlock';
import { useThemedStyles } from '@/theme';

/** Shimmer layout for stack detail screens (job, shift, application). */
export function DetailHeroSkeleton() {
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    container: {
      gap: spacing.lg,
      paddingTop: spacing.sm,
      width: '100%',
      alignSelf: 'stretch' as const,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    heroLines: {
      flex: 1,
      gap: spacing.sm,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
  }));

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <View style={styles.heroCard}>
        <ShimmerBlock height={48} width={48} borderRadius={24} />
        <View style={styles.heroLines}>
          <ShimmerBlock height={14} width="46%" borderRadius={6} />
          <ShimmerBlock height={18} width="78%" borderRadius={6} />
          <ShimmerBlock height={12} width="58%" borderRadius={6} />
        </View>
      </View>
      <View style={styles.section}>
        <ShimmerBlock height={12} width="34%" borderRadius={6} />
        <ShimmerBlock height={14} width="92%" borderRadius={6} />
        <ShimmerBlock height={14} width="86%" borderRadius={6} />
        <ShimmerBlock height={14} width="64%" borderRadius={6} />
      </View>
      <View style={styles.section}>
        <ShimmerBlock height={12} width="28%" borderRadius={6} />
        <ShimmerBlock height={44} width="100%" borderRadius={12} />
      </View>
    </View>
  );
}
