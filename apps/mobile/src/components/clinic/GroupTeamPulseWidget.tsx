import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardWidgetHeader } from '@/components/dashboard/DashboardWidgetHeader';
import type { TeamPulseCounts } from '@/lib/groupDashboardMetrics';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type GroupTeamPulseWidgetProps = {
  counts: TeamPulseCounts;
  onPress: () => void;
};

/** Owner-only group dashboard: pending invites and unassigned managers. */
export function GroupTeamPulseWidget({ counts, onPress }: GroupTeamPulseWidgetProps) {
  const { colors } = useTheme();
  const { pendingInvites, unassignedManagers } = counts;

  if (pendingInvites === 0 && unassignedManagers === 0) return null;

  const lines: string[] = [];
  if (pendingInvites > 0) {
    lines.push(
      `${pendingInvites} pending invite${pendingInvites === 1 ? '' : 's'}`,
    );
  }
  if (unassignedManagers > 0) {
    lines.push(
      `${unassignedManagers} manager${unassignedManagers === 1 ? '' : 's'} need a location`,
    );
  }

  const styles = useThemedStyles(({ colors, spacing, radii, typography }) => ({
    card: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
    },
    body: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      ...webPointer(),
    },
    bodyHovered: webListRowHoverStyles(colors),
    bodyPressed: { opacity: 0.92 },
    text: { flex: 1, minWidth: 0, gap: 2 },
    line: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelPrimary,
      fontWeight: '600' as const,
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
  }));

  return (
    <View style={styles.card}>
      <DashboardWidgetHeader title="Team" icon="people-outline" accent="tertiary" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Team. ${lines.join('. ')}. Open team settings.`}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={({ pressed, hovered }) => [
          styles.body,
          webHover(hovered, pressed, styles.bodyHovered),
          pressed && styles.bodyPressed,
        ]}>
        <View style={styles.text}>
          {lines.map((line) => (
            <Text key={line} style={styles.line}>
              {line}
            </Text>
          ))}
          <Text style={styles.hint}>Review in Team & access</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
      </Pressable>
    </View>
  );
}
