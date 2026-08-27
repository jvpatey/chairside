import type { CalendarEvent } from '@chairside/api';
import { getRoleTypeLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import {
  calendarEventAccent,
  calendarEventKindLabel,
  formatCalendarEventTime,
} from '@/lib/calendarEvents';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { formatShiftDateLabel, parseISODate } from '@/lib/dates';
import { getConfirmedFillInCardCopy } from '@/lib/fillInHistoryDisplay';
import { isPastShiftDate } from '@/lib/fillInFilters';
import { useTheme, useThemedStyles } from '@/theme';

type ScheduleEventCardProps = {
  event: CalendarEvent;
  onPress: () => void;
  audience: 'worker' | 'clinic';
};

function getOpenFillInPresentation(event: CalendarEvent) {
  const timeLabel = formatCalendarEventTime(event);
  const location = event.location?.trim() || null;
  const roleLabel = event.roleType ? getRoleTypeLabel(event.roleType) : event.title;

  return {
    eyebrow: calendarEventKindLabel(event.kind),
    title: roleLabel,
    meta: event.subtitle,
    detail: [timeLabel, location && location !== event.subtitle ? location : null]
      .filter(Boolean)
      .join(' · ') || timeLabel,
  };
}

function getConfirmedFillInPresentation(
  event: CalendarEvent,
  audience: 'worker' | 'clinic',
) {
  const date = parseISODate(event.dateKey);
  const dateLabel = date ? formatShiftDateLabel(date) : null;
  const timeLabel = formatCalendarEventTime(event);
  const location = event.location?.trim() || null;
  const roleLabel = event.roleType ? getRoleTypeLabel(event.roleType) : null;
  const copy = getConfirmedFillInCardCopy({
    counterpartName: event.subtitle || event.counterpartName,
    audience,
    isPast: isPastShiftDate(event.dateKey),
  });

  return {
    eyebrow: copy.eyebrow,
    title: copy.title,
    meta: roleLabel,
    headerDetail: dateLabel,
    detail: [timeLabel, location].filter(Boolean).join(' · ') || null,
  };
}

function EventAvatar({ event }: { event: CalendarEvent }) {
  const { colors } = useTheme();
  const accent = calendarEventAccent(event.kind);
  const iconName =
    event.kind === 'interview'
      ? 'videocam-outline'
      : event.kind === 'confirmed_fill_in' || event.kind === 'open_fill_in'
        ? FILL_IN_ICON.outline
        : 'calendar-outline';
  const backgroundColor =
    accent === 'primary'
      ? colors.primarySubtle
      : accent === 'warning'
        ? `${colors.warning}18`
        : colors.secondarySubtle;
  const iconColor =
    accent === 'primary'
      ? colors.primary
      : accent === 'warning'
        ? colors.warning
        : colors.secondary;

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

export function ScheduleEventCard({ event, onPress, audience }: ScheduleEventCardProps) {
  if (event.kind === 'confirmed_fill_in') {
    const presentation = getConfirmedFillInPresentation(event, audience);

    return (
      <SurfaceCard padding="none" onPress={onPress}>
        <BrowseListRow
          avatar={<EventAvatar event={event} />}
          eyebrow={presentation.eyebrow}
          title={presentation.title}
          meta={presentation.meta}
          headerDetail={presentation.headerDetail}
          detail={presentation.detail}
          onPress={onPress}
        />
      </SurfaceCard>
    );
  }

  if (event.kind === 'open_fill_in') {
    const presentation = getOpenFillInPresentation(event);

    return (
      <SurfaceCard padding="none" onPress={onPress}>
        <BrowseListRow
          avatar={<EventAvatar event={event} />}
          eyebrow={presentation.eyebrow}
          title={presentation.title}
          meta={presentation.meta}
          detail={presentation.detail}
          onPress={onPress}
        />
      </SurfaceCard>
    );
  }

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
          event.status ? (
            <ClinicApplicationStatusBadge status={event.status} postType={event.postType} />
          ) : null
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
  audience: 'worker' | 'clinic';
  emptyTitle?: string;
  emptyMessage?: string;
  emptyCtaLabel?: string;
  onEmptyCtaPress?: () => void;
};

export function ScheduleAgendaList({
  events,
  selectedDate,
  onEventPress,
  audience,
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
        <EmptyState
          icon="calendar-outline"
          title={emptyTitle}
          message={emptyMessage}
          ctaLabel={emptyCtaLabel}
          onCtaPress={onEmptyCtaPress}
        />
      ) : (
        <View style={styles.list}>
          <StaggeredList>
            {events.map((event) => (
              <ScheduleEventCard
                key={event.id}
                event={event}
                audience={audience}
                onPress={() => onEventPress(event)}
              />
            ))}
          </StaggeredList>
        </View>
      )}
    </View>
  );
}
