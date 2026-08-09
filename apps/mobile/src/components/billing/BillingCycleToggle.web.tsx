import type { BillingCycle } from '@/lib/billingOfferings';
import { SlidingSegmentIndicator } from '@/components/ui/SlidingSegmentIndicator';
import { useSlidingSegmentIndicator } from '@/hooks/useSlidingSegmentIndicator';
import { webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

type BillingCycleToggleProps = {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  hasMonthly: boolean;
  hasYearly: boolean;
  /** Accepted for API parity with native; not shown on web. */
  yearlySavingsPercent?: number | null;
};

const CYCLES = ['monthly', 'yearly'] as const;

/** Web billing cycle switch — sliding pill like welcome / tab segments. */
export function BillingCycleToggle({
  value,
  onChange,
  hasMonthly,
  hasYearly,
}: BillingCycleToggleProps) {
  const selectedIndex = Math.max(0, CYCLES.indexOf(value));
  const { animatedStyle: indicatorStyle, onSegmentLayout } = useSlidingSegmentIndicator(
    selectedIndex,
    'horizontal',
  );

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    wrap: {
      alignSelf: 'center' as const,
      width: '100%',
      maxWidth: 400,
    },
    row: {
      flexDirection: 'row' as const,
      position: 'relative' as const,
      backgroundColor: colors.fillSubtle,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: 4,
    },
    indicator: {
      position: 'absolute' as const,
      top: 4,
      left: 0,
      borderRadius: radii.pill,
      backgroundColor: colors.primary,
    },
    optionWrap: {
      flex: 1,
      minWidth: 0,
    },
    option: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      minHeight: 40,
      ...webPointer(),
    },
    label: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
      zIndex: 1,
    },
    labelSelected: {
      color: colors.primaryOnPrimary,
      fontWeight: '700' as const,
    },
  }));

  if (!hasMonthly || !hasYearly) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row} accessibilityRole="tablist">
        <SlidingSegmentIndicator animatedStyle={indicatorStyle} style={styles.indicator} />
        {CYCLES.map((cycle, index) => {
          const selected = value === cycle;
          return (
            <View
              key={cycle}
              style={styles.optionWrap}
              onLayout={(event) => {
                const { x, y, width, height } = event.nativeEvent.layout;
                onSegmentLayout(index, { x, y, width, height });
              }}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => {
                  void Haptics.selectionAsync();
                  onChange(cycle);
                }}
                style={({ pressed }) => [styles.option, pressed && { opacity: 0.85 }]}>
                <Text
                  style={[styles.label, selected && styles.labelSelected]}
                  numberOfLines={1}>
                  {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
