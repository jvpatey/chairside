import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { DashboardWidgetHeader } from '@/components/dashboard/DashboardWidgetHeader';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import type { WeekCoverageRow } from '@/lib/groupDashboardMetrics';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { fontBold, useTheme, useThemedStyles } from '@/theme';

type GroupWeekCoverageWidgetProps = {
  rows: WeekCoverageRow[];
  onSelectLocation: (locationId: string) => void;
};

function formatNearestDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function CoverageRowItem({
  row,
  onPress,
}: {
  row: WeekCoverageRow;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const logoUri = useClinicLogoUri(row.logoStoragePath);
  const nearest = formatNearestDate(row.nearestShiftDate);
  const countLabel = `${row.unfilledCount} unfilled fill-in${row.unfilledCount === 1 ? '' : 's'}`;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      ...webPointer(),
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: { opacity: 0.92 },
    text: { flex: 1, minWidth: 0, gap: 2 },
    name: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontBold,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.name}. ${countLabel}`}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, styles.rowHovered),
        pressed && styles.rowPressed,
      ]}>
      <ClinicLogoAvatar clinicName={row.name} logoUri={logoUri} size={36} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {row.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {nearest ? `${countLabel} · next ${nearest}` : countLabel}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
    </Pressable>
  );
}

/** Group dashboard: unfilled fill-ins in the next 7 days by location. */
export function GroupWeekCoverageWidget({
  rows,
  onSelectLocation,
}: GroupWeekCoverageWidgetProps) {
  const styles = useThemedStyles(({ colors, spacing, radii, typography }) => ({
    card: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
    },
    list: {
      gap: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    emptyBody: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    emptyTitle: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.card}>
      <DashboardWidgetHeader
        title="This week"
        icon="time-outline"
        accent="secondary"
      />
      {rows.length === 0 ? (
        <View style={styles.emptyBody}>
          <Text style={styles.emptyTitle}>No unfilled fill-ins in the next 7 days</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => (
            <CoverageRowItem
              key={row.locationId}
              row={row}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectLocation(row.locationId);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
