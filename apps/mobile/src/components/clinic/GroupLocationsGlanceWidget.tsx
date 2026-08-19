import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { DashboardWidgetHeader } from '@/components/dashboard/DashboardWidgetHeader';
import { PillBadge } from '@/components/ui/PillBadge';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import {
  formatLocationGlanceCounts,
  type LocationGlanceRow,
} from '@/lib/groupDashboardMetrics';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { colorWithAlpha, fontBold, useTheme, useThemedStyles } from '@/theme';

type GroupLocationsGlanceWidgetProps = {
  rows: LocationGlanceRow[];
  onSelectLocation: (locationId: string) => void;
};

function LocationGlanceRowItem({
  row,
  onPress,
}: {
  row: LocationGlanceRow;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const logoUri = useClinicLogoUri(row.logoStoragePath);
  const meta = [row.city, row.province].filter(Boolean).join(', ');
  const counts = formatLocationGlanceCounts(row);

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
      fontSize: 16,
      lineHeight: 22,
      fontFamily: fontBold,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
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
      accessibilityLabel={`View ${row.name}. ${counts}`}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, styles.rowHovered),
        pressed && styles.rowPressed,
      ]}>
      <ClinicLogoAvatar clinicName={row.name} logoUri={logoUri} size={40} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {row.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta ? `${meta} · ${counts}` : counts}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
    </Pressable>
  );
}

/** Group dashboard: per-location activity when viewing all locations. */
export function GroupLocationsGlanceWidget({
  rows,
  onSelectLocation,
}: GroupLocationsGlanceWidgetProps) {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
    },
    headerPressable: {
      ...webPointer(),
    },
    headerHovered: webListRowHoverStyles(colors),
    headerPressed: { opacity: 0.92 },
    collapseControl: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    list: {
      gap: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    hint: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
  }));

  if (rows.length === 0) return null;

  const locationCountLabel = `${rows.length} location${rows.length === 1 ? '' : 's'}`;

  const toggleExpanded = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((current) => !current);
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Locations, ${locationCountLabel}. ${expanded ? 'Collapse' : 'Expand'}.`}
        onPress={toggleExpanded}
        style={({ pressed, hovered }) => [
          styles.headerPressable,
          webHover(hovered, pressed, styles.headerHovered),
          pressed && styles.headerPressed,
        ]}>
        <DashboardWidgetHeader
          title="Locations"
          icon="business-outline"
          accent="primary"
          trailing={
            <View style={styles.collapseControl}>
              <PillBadge
                label={String(rows.length)}
                color={colors.labelSecondary}
                backgroundColor={colorWithAlpha(colors.labelTertiary, isDark ? 0.22 : 0.12)}
                borderColor={colorWithAlpha(colors.labelTertiary, 0.28)}
                size="sm"
              />
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.labelTertiary}
              />
            </View>
          }
        />
      </Pressable>
      {expanded ? (
        <>
          <Text style={styles.hint}>Tap a clinic to focus the dashboard</Text>
          <View style={styles.list}>
            {rows.map((row) => (
              <LocationGlanceRowItem
                key={row.locationId}
                row={row}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelectLocation(row.locationId);
                }}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}
