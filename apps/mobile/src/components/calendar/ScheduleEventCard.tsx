import type { CalendarEvent } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import {
  calendarEventAccent,
  calendarEventKindLabel,
  formatCalendarEventTime,
} from '@/lib/calendarEvents';
import { formatShiftDateLabel } from '@/lib/dates';
import { useTheme, useThemedStyles } from '@/theme';

type ScheduleEventCardProps = {
  event: CalendarEvent;
  onPress: () => void;
};

function EventAvatar({ event }: { event: CalendarEvent }) {
  const { colors } = useTheme();
  const accent = calendarEventAccent(event.kind);
  const iconName = event.kind === 'interview' ? 'videocam-outline' : 'calendar-outline';
  const backgroundColor = accent === 'primary' ? colors.primarySubtle : colors.secondarySubtle;
  const iconColor = accent === 'primary' ? colors.primary : colors.secondary;

  const styles = useThemedStyles(({ radii }) => ({
    avatar: {
      width: 40,
      height: 40,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor,
    },
  }));

  return (
    <View style={styles.avatar}>
      <Ionicons name={iconName} size={20} color={iconColor} />
    </View>
  );
}

export function ScheduleEventCard({ event, onPress }: ScheduleEventCardProps) {
  const timeLabel = formatCalendarEventTime(event);
  const kindLabel = calendarEventKindLabel(event.kind);
  const location = event.location?.trim();

  return (
    <SurfaceCard padding="none" onPress={onPress}>
      <BrowseListRow
        avatar={<EventAvatar event={event} />}
        eyebrow={kindLabel}
        title={event.title}
        meta={event.subtitle}
        detail={[timeLabel, location].filter(Boolean).join(' · ') || null}
        textFooter={
          <ClinicApplicationStatusBadge status={event.status} postType={event.postType} />
        }
        onPress={onPress}
      />
    </SurfaceCard>
  );
}

type ScheduleAgendaListProps = {
  events: CalendarEvent[];
  selectedDate: Date;
  onEventPress: (event: CalendarEvent) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyCtaLabel?: string;
  onEmptyCtaPress?: () => void;
};

export function ScheduleAgendaList({
  events,
  selectedDate,
  onEventPress,
  emptyTitle = 'Nothing scheduled',
  emptyMessage = 'No interviews or confirmed fill-ins on this day.',
  emptyCtaLabel,
  onEmptyCtaPress,
}: ScheduleAgendaListProps) {
  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    wrap: { gap: spacing.md },
    header: {
      gap: spacing.xs,
    },
    title: {
      ...typography.label,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 14,
      color: colors.labelSecondary,
    },
    list: { gap: spacing.sm },
    empty: {
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    emptyTitle: {
      ...typography.label,
      color: colors.labelPrimary,
    },
    emptyMessage: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    emptyCta: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
    },
    emptyCtaLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const dateLabel = formatShiftDateLabel(selectedDate);
  const countLabel =
    events.length === 0
      ? 'No events'
      : `${events.length} event${events.length === 1 ? '' : 's'}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{dateLabel}</Text>
        <Text style={styles.subtitle}>{countLabel}</Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
          {emptyCtaLabel && onEmptyCtaPress ? (
            <Pressable
              accessibilityRole="button"
              onPress={onEmptyCtaPress}
              style={styles.emptyCta}>
              <Text style={styles.emptyCtaLabel}>{emptyCtaLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.list}>
          <StaggeredList>
            {events.map((event) => (
              <ScheduleEventCard key={event.id} event={event} onPress={() => onEventPress(event)} />
            ))}
          </StaggeredList>
        </View>
      )}
    </View>
  );
}
