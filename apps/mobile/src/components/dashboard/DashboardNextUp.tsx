import { Ionicons } from '@expo/vector-icons';
import type { CalendarEvent } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View } from 'react-native';

import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { SurfaceWell } from '@/components/ui/SurfaceWell';
import { webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import { fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type DashboardNextUpProps = {
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onViewCalendar: () => void;
  maxItems?: number;
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
  return kind === 'confirmed_fill_in' ? 'calendar' : 'videocam-outline';
}

/** Upcoming interviews and confirmed fill-ins. */
export function DashboardNextUp({
  events,
  onEventPress,
  onViewCalendar,
  maxItems = 3,
}: DashboardNextUpProps) {
  const { colors, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';
  const upcoming = events.slice(0, maxItems);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    wrap: {
      gap: spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
      letterSpacing: 0.2,
      textTransform: 'uppercase' as const,
    },
    viewAll: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.primary,
    },
    viewAllPressable: {
      ...webPointer(),
    },
    list: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radii.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.tertiarySubtle,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
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
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
    empty: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
    rowHovered: webTileHoverStyles(colors, isDark),
    rowPressed: {
      opacity: 0.9,
    },
  }));

  return (
    <FadeInSection delayMs={60}>
      <View style={styles.wrap}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Next up</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View calendar"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onViewCalendar();
            }}
            style={styles.viewAllPressable}>
            <Text style={styles.viewAll}>Calendar</Text>
          </Pressable>
        </View>
        <SurfaceWell tinted contentStyle={styles.list}>
          {upcoming.length === 0 ? (
            <Text style={styles.empty}>No upcoming interviews or confirmed shifts.</Text>
          ) : (
            upcoming.map((event) => (
              <Pressable
                key={event.id}
                accessibilityRole="button"
                accessibilityLabel={`${event.title}. ${event.subtitle}`}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onEventPress(event);
                }}
                style={({ pressed, hovered }) => [
                  styles.row,
                  isWeb && hovered && !pressed && styles.rowHovered,
                  pressed && styles.rowPressed,
                ]}>
                <View style={styles.iconWrap}>
                  <Ionicons name={eventIcon(event.kind)} size={18} color={colors.tertiary} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={styles.eventMeta} numberOfLines={2}>
                    {formatEventTime(event.startsAt, event.endsAt)}
                    {event.subtitle ? ` · ${event.subtitle}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
              </Pressable>
            ))
          )}
        </SurfaceWell>
      </View>
    </FadeInSection>
  );
}
