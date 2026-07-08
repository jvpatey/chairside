import type { BillingCycle } from '@/lib/billingOfferings';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';
import { Pressable, Text, View } from 'react-native';

type BillingCycleToggleProps = {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  hasMonthly: boolean;
  hasYearly: boolean;
  yearlySavingsPercent?: number | null;
};

export function BillingCycleToggle({
  value,
  onChange,
  hasMonthly,
  hasYearly,
  yearlySavingsPercent,
}: BillingCycleToggleProps) {
  const { colors, isDark } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    row: {
      flexDirection: 'row',
      backgroundColor: colors.fillSubtle,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: 3,
      gap: 3,
    },
    option: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radii.sm + 2,
      minHeight: 40,
    },
    optionSelected: {
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colorWithAlpha(colors.primaryOnPrimary, isDark ? 0.12 : 0.2),
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    label: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    labelSelected: {
      color: colors.primaryOnPrimary,
      fontWeight: '700',
    },
    savingsBadge: {
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: colorWithAlpha(colors.success, isDark ? 0.22 : 0.14),
    },
    savingsBadgeSelected: {
      backgroundColor: colorWithAlpha(colors.primaryOnPrimary, isDark ? 0.16 : 0.2),
    },
    savingsText: {
      ...typography.subtitle,
      fontSize: 10,
      fontWeight: '700',
      color: colors.success,
    },
    savingsTextSelected: {
      color: colors.primaryOnPrimary,
    },
  }));

  if (!hasMonthly || !hasYearly) return null;

  const showYearlySavings =
    yearlySavingsPercent != null && yearlySavingsPercent > 0;

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {(['monthly', 'yearly'] as const).map((cycle) => {
        const selected = value === cycle;
        const showBadge = cycle === 'yearly' && showYearlySavings;

        return (
          <Pressable
            key={cycle}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(cycle)}
            style={[styles.option, selected && styles.optionSelected]}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              </Text>
              {showBadge ? (
                <View style={[styles.savingsBadge, selected && styles.savingsBadgeSelected]}>
                  <Text style={[styles.savingsText, selected && styles.savingsTextSelected]}>
                    Save {yearlySavingsPercent}%
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
