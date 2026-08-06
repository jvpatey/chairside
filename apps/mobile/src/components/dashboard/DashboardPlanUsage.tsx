import { Text, View } from 'react-native';

import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { useDashboardAsideCompact } from '@/components/dashboard/DashboardAsideCompactContext';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type DashboardPlanUsageProps = {
  label: string;
  used: number;
  limit: number | null;
  secondaryLabel?: string;
  secondaryUsed?: number;
  secondaryLimit?: number | null;
};

/** Compact plan capacity meter for clinic dashboard aside. */
export function DashboardPlanUsage({
  label,
  used,
  limit,
  secondaryLabel,
  secondaryUsed,
  secondaryLimit,
}: DashboardPlanUsageProps) {
  const { colors } = useTheme();
  const compact = useDashboardAsideCompact();
  const ringSize = compact ? 32 : 44;
  const ringStroke = compact ? 3 : 4;
  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      gap: compact ? spacing.sm : spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? spacing.sm : spacing.md,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      fontSize: compact ? 12 : 14,
      lineHeight: compact ? 16 : 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: compact ? 11 : 13,
      lineHeight: compact ? 14 : 18,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
  }));

  const primaryLimit = limit ?? used;
  const showSecondary =
    secondaryLabel != null &&
    secondaryUsed != null &&
    secondaryLimit != null &&
    secondaryLimit > 0;

  return (
    <SurfaceCard padding={compact ? 'sm' : 'md'} elevationLevel="subtle">
      <View style={styles.card}>
        <View style={styles.row}>
          <ProgressRing
            completed={used}
            total={primaryLimit || 1}
            size={ringSize}
            strokeWidth={ringStroke}
            color={colors.tertiary}
          />
          <View style={styles.textBlock}>
            <Text style={styles.title} numberOfLines={compact ? 1 : undefined}>
              {label}
            </Text>
            <Text style={styles.meta} numberOfLines={compact ? 1 : undefined}>
              {limit != null ? `${used}/${limit}` : `${used} active`}
            </Text>
          </View>
        </View>
        {showSecondary ? (
          <View style={styles.row}>
            <ProgressRing
              completed={secondaryUsed}
              total={secondaryLimit || 1}
              size={ringSize}
              strokeWidth={ringStroke}
              color={colors.secondary}
            />
            <View style={styles.textBlock}>
              <Text style={styles.title} numberOfLines={compact ? 1 : undefined}>
                {secondaryLabel}
              </Text>
              <Text style={styles.meta} numberOfLines={compact ? 1 : undefined}>
                {secondaryLimit != null
                  ? `${secondaryUsed}/${secondaryLimit}`
                  : `${secondaryUsed} active`}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </SurfaceCard>
  );
}
