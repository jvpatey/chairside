import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { useDashboardAsideCompact } from '@/components/dashboard/DashboardAsideCompactContext';
import { DashboardWidgetHeader } from '@/components/dashboard/DashboardWidgetHeader';
import { dashboardWidgetTokens } from '@/components/dashboard/dashboardTokens';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type DashboardPlanUsageProps = {
  label: string;
  used: number;
  limit: number | null;
  secondaryLabel?: string;
  secondaryUsed?: number;
  secondaryLimit?: number | null;
  onViewPlansPress?: () => void;
};

function formatUsageMeta(used: number, limit: number | null): string {
  if (limit == null) return `${used} active`;
  if (used >= limit) return 'At plan limit';
  const remaining = limit - used;
  return remaining === 1 ? '1 slot left' : `${remaining} slots left`;
}

function formatUsageAccessibility(label: string, used: number, limit: number | null): string {
  if (limit == null) return `${label}: ${used} active`;
  return `${label}: ${used} of ${limit}. ${formatUsageMeta(used, limit)}`;
}

/** Compact plan capacity meter for clinic dashboard aside. */
export function DashboardPlanUsage({
  label,
  used,
  limit,
  secondaryLabel,
  secondaryUsed,
  secondaryLimit,
  onViewPlansPress,
}: DashboardPlanUsageProps) {
  const { colors } = useTheme();
  const compact = useDashboardAsideCompact();
  const ringSize = compact ? 32 : 40;
  const ringStroke = compact ? 3 : 4;

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
    },
    viewAllPressable: {
      borderRadius: radii.sm,
      paddingHorizontal: 4,
      paddingVertical: 2,
      flexShrink: 0,
      ...webPointer(),
    },
    viewAllHovered: webListRowHoverStyles(colors),
    viewAll: {
      fontSize: dashboardWidgetTokens.headerAction.fontSize,
      fontWeight: '600',
      color: colors.primary,
    },
    body: {
      paddingHorizontal: compact ? spacing.md : spacing.lg,
      paddingVertical: compact ? spacing.md : spacing.md,
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
      fontSize: compact ? 13 : 14,
      lineHeight: compact ? 16 : 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: compact ? 12 : 13,
      lineHeight: compact ? 16 : 18,
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

  const handleViewPlans = () => {
    if (!onViewPlansPress) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewPlansPress();
  };

  return (
    <View style={styles.card}>
      <DashboardWidgetHeader
        title="Plan usage"
        icon="speedometer-outline"
        accent="tertiary"
        trailing={
          onViewPlansPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View plans"
              hitSlop={8}
              onPress={handleViewPlans}
              style={({ pressed, hovered }) => [
                styles.viewAllPressable,
                webHover(hovered, pressed, styles.viewAllHovered),
              ]}>
              <Text style={styles.viewAll}>View plans</Text>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.body}>
        <View style={styles.row}>
          <ProgressRing
            completed={used}
            total={primaryLimit || 1}
            size={ringSize}
            strokeWidth={ringStroke}
            color={colors.tertiary}
            accessibilityLabel={formatUsageAccessibility(label, used, limit)}
          />
          <View style={styles.textBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {label}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {formatUsageMeta(used, limit)}
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
              accessibilityLabel={formatUsageAccessibility(secondaryLabel!, secondaryUsed!, secondaryLimit!)}
            />
            <View style={styles.textBlock}>
              <Text style={styles.title} numberOfLines={1}>
                {secondaryLabel}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {formatUsageMeta(secondaryUsed, secondaryLimit)}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
