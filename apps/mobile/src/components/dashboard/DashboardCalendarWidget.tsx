import { Ionicons } from '@expo/vector-icons';
import type { CalendarEvent } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { PillBadge } from '@/components/ui/PillBadge';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { colorWithAlpha, fontSemibold, useTheme, useThemedStyles } from '@/theme';

const PREVIEW_LIMIT = 2;
const IS_WEB = Platform.OS === 'web';

export type DashboardCalendarWidgetProps = {
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onViewAllPress: () => void;
};

function formatEventTime(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return '';
  const datePart = start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = start.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (!endsAt) return `${datePart} · ${timePart}`;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return `${datePart} · ${timePart}`;
  const endTime = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${datePart} · ${timePart}–${endTime}`;
}

function eventIcon(kind: CalendarEvent['kind']): keyof typeof Ionicons.glyphMap {
  return kind === 'confirmed_fill_in' ? 'calendar-outline' : 'videocam-outline';
}

/** Always-visible dashboard calendar glance — flat surface with upcoming previews or empty state. */
export function DashboardCalendarWidget({
  events,
  onEventPress,
  onViewAllPress,
}: DashboardCalendarWidgetProps) {
  const { colors, isDark } = useTheme();
  const upcomingCount = events.length;
  const previews = events.slice(0, PREVIEW_LIMIT);

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    card: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
      minWidth: 0,
      flexShrink: 1,
    },
    iconBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.tertiarySubtle,
      flexShrink: 0,
    },
    headerTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
      flexShrink: 1,
    },
    headerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
      marginLeft: spacing.sm,
    },
    viewAllPressable: {
      borderRadius: radii.sm,
      paddingHorizontal: 4,
      paddingVertical: 2,
      ...webPointer(),
    },
    viewAllHovered: webListRowHoverStyles(colors),
    viewAll: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyBody: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    emptyTitle: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    emptyHint: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    previews: {
      gap: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      ...webPointer(),
    },
    previewRowHovered: webListRowHoverStyles(colors),
    previewRowPressed: {
      opacity: 0.92,
    },
    previewText: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    eventTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    eventMeta: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  const handleViewAll = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewAllPress();
  };

  const upcomingBadgeLabel =
    upcomingCount === 1
      ? '1 upcoming'
      : upcomingCount > 1
        ? `${upcomingCount} upcoming`
        : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Ionicons name="calendar-outline" size={17} color={colors.tertiary} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Calendar
          </Text>
        </View>
        <View style={styles.headerMeta}>
          {upcomingBadgeLabel ? (
            <PillBadge
              label={upcomingBadgeLabel}
              color={colors.tertiary}
              backgroundColor={colorWithAlpha(colors.tertiary, isDark ? 0.2 : 0.12)}
              borderColor={colorWithAlpha(colors.tertiary, 0.28)}
              size="sm"
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View calendar"
            hitSlop={8}
            onPress={handleViewAll}
            style={({ pressed, hovered }) => [
              styles.viewAllPressable,
              webHover(hovered, pressed, styles.viewAllHovered),
            ]}>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>
      </View>

      {upcomingCount === 0 ? (
        <View style={styles.emptyBody}>
          <Text style={styles.emptyTitle}>No upcoming interviews or confirmed shifts</Text>
          <Text style={styles.emptyHint}>
            {IS_WEB
              ? 'Nothing scheduled'
              : 'Nothing scheduled · Open the Calendar tab to see your full schedule.'}
          </Text>
        </View>
      ) : (
        <View style={styles.previews}>
          {previews.map((event) => (
            <Pressable
              key={event.id}
              accessibilityRole="button"
              accessibilityLabel={`${event.title}. ${event.subtitle ?? ''}`}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onEventPress(event);
              }}
              style={({ pressed, hovered }) => [
                styles.previewRow,
                webHover(hovered, pressed, styles.previewRowHovered),
                pressed && styles.previewRowPressed,
              ]}>
              <View style={styles.iconBadge}>
                <Ionicons name={eventIcon(event.kind)} size={17} color={colors.tertiary} />
              </View>
              <View style={styles.previewText}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={styles.eventMeta} numberOfLines={2}>
                  {formatEventTime(event.startsAt, event.endsAt)}
                  {event.subtitle ? ` · ${event.subtitle}` : ''}
                </Text>
              </View>
              {IS_WEB ? (
                <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
