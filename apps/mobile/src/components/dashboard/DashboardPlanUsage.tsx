import { Text, View } from 'react-native';

import { ProgressRing } from '@/components/dashboard/ProgressRing';
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
  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 13,
      lineHeight: 18,
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
    <SurfaceCard padding="md" elevationLevel="subtle">
      <View style={styles.card}>
        <View style={styles.row}>
          <ProgressRing
            completed={used}
            total={primaryLimit || 1}
            size={44}
            strokeWidth={4}
            color={colors.tertiary}
          />
          <View style={styles.textBlock}>
            <Text style={styles.title}>{label}</Text>
            <Text style={styles.meta}>
              {limit != null ? `${used} of ${limit} used` : `${used} active`}
            </Text>
          </View>
        </View>
        {showSecondary ? (
          <View style={styles.row}>
            <ProgressRing
              completed={secondaryUsed}
              total={secondaryLimit || 1}
              size={44}
              strokeWidth={4}
              color={colors.secondary}
            />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{secondaryLabel}</Text>
              <Text style={styles.meta}>
                {secondaryLimit != null
                  ? `${secondaryUsed} of ${secondaryLimit} used`
                  : `${secondaryUsed} active`}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </SurfaceCard>
  );
}
