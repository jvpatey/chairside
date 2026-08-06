import type { CalendarEvent, Conversation } from '@chairside/api';
import type { Ionicons } from '@expo/vector-icons';

export type DashboardHeroPulse = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type PulseSegment = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatPulseTime(startsAt: string) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return '';
  return start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function calendarEventPulseLabel(event: CalendarEvent): string {
  const time = formatPulseTime(event.startsAt);
  if (event.kind === 'interview') {
    return `Interview at ${time}`;
  }
  return `Fill-in at ${time}`;
}

function nextEventToday(events: CalendarEvent[], now = new Date()): CalendarEvent | null {
  return (
    events.find((event) => {
      const start = new Date(event.startsAt);
      return !Number.isNaN(start.getTime()) && isSameCalendarDay(start, now);
    }) ?? null
  );
}

function unreadConversationSegments(
  conversations: Conversation[],
  onOpenMessages: () => void,
  onOpenConversation: (conversation: Conversation) => void,
): PulseSegment | null {
  const unread = conversations.filter((conversation) => conversation.unread);
  if (unread.length === 0) return null;

  if (unread.length === 1) {
    return {
      label: '1 unread message',
      icon: 'chatbubble-outline',
      onPress: () => onOpenConversation(unread[0]),
    };
  }

  return {
    label: `${unread.length} unread messages`,
    icon: 'chatbubble-outline',
    onPress: onOpenMessages,
  };
}

function composePulse(segments: PulseSegment[]): DashboardHeroPulse | null {
  if (segments.length === 0) return null;
  return {
    label: segments.map((segment) => segment.label).join(' · '),
    icon: segments[0].icon,
    onPress: segments[0].onPress,
  };
}

type BuildClinicHeroPulseInput = {
  newApplications: number;
  upcomingEvents: CalendarEvent[];
  unreadConversations: Conversation[];
  onOpenApplications: () => void;
  onOpenEvent: (event: CalendarEvent) => void;
  onOpenMessages: () => void;
  onOpenConversation: (conversation: Conversation) => void;
};

export function buildClinicHeroPulse({
  newApplications,
  upcomingEvents,
  unreadConversations,
  onOpenApplications,
  onOpenEvent,
  onOpenMessages,
  onOpenConversation,
}: BuildClinicHeroPulseInput): DashboardHeroPulse | null {
  const segments: PulseSegment[] = [];

  if (newApplications > 0) {
    segments.push({
      label: `${newApplications} new applicant${newApplications === 1 ? '' : 's'}`,
      icon: 'document-text-outline',
      onPress: onOpenApplications,
    });
  }

  const eventToday = nextEventToday(upcomingEvents);
  if (eventToday) {
    segments.push({
      label: calendarEventPulseLabel(eventToday),
      icon: eventToday.kind === 'interview' ? 'videocam-outline' : 'calendar-outline',
      onPress: () => onOpenEvent(eventToday),
    });
  }

  const messageSegment = unreadConversationSegments(
    unreadConversations,
    onOpenMessages,
    onOpenConversation,
  );
  if (messageSegment) {
    segments.push(messageSegment);
  }

  return composePulse(segments.slice(0, 3));
}

type BuildWorkerHeroPulseInput = {
  applicationUpdateCount: number;
  upcomingEvents: CalendarEvent[];
  unreadConversations: Conversation[];
  onOpenApplications: () => void;
  onOpenEvent: (event: CalendarEvent) => void;
  onOpenMessages: () => void;
  onOpenConversation: (conversation: Conversation) => void;
};

export function buildWorkerHeroPulse({
  applicationUpdateCount,
  upcomingEvents,
  unreadConversations,
  onOpenApplications,
  onOpenEvent,
  onOpenMessages,
  onOpenConversation,
}: BuildWorkerHeroPulseInput): DashboardHeroPulse | null {
  const segments: PulseSegment[] = [];

  if (applicationUpdateCount > 0) {
    segments.push({
      label: `${applicationUpdateCount} application update${applicationUpdateCount === 1 ? '' : 's'}`,
      icon: 'document-text-outline',
      onPress: onOpenApplications,
    });
  }

  const nextConfirmedShift = upcomingEvents.find((event) => event.kind === 'confirmed_fill_in');
  if (nextConfirmedShift) {
    const start = new Date(nextConfirmedShift.startsAt);
    const isToday = !Number.isNaN(start.getTime()) && isSameCalendarDay(start, new Date());
    segments.push({
      label: isToday
        ? calendarEventPulseLabel(nextConfirmedShift)
        : `Confirmed shift ${start.toLocaleDateString(undefined, { weekday: 'short' })} at ${formatPulseTime(nextConfirmedShift.startsAt)}`,
      icon: 'calendar-outline',
      onPress: () => onOpenEvent(nextConfirmedShift),
    });
  }

  const messageSegment = unreadConversationSegments(
    unreadConversations,
    onOpenMessages,
    onOpenConversation,
  );
  if (messageSegment) {
    segments.push(messageSegment);
  }

  return composePulse(segments.slice(0, 3));
}
