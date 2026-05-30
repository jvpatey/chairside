import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { Colors } from '@/theme/colors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type NotificationAccent = 'primary' | 'success' | 'destructive' | 'secondary' | 'urgent' | 'info';

export type NotificationDisplayMeta = {
  icon: IoniconName;
  accent: NotificationAccent;
  subtitle: string;
};

const TYPE_META: Record<string, NotificationDisplayMeta> = {
  application_received: {
    icon: 'person-add-outline',
    accent: 'primary',
    subtitle: 'New application',
  },
  application_reviewed: {
    icon: 'eye-outline',
    accent: 'info',
    subtitle: 'Application update',
  },
  application_in_progress: {
    icon: 'time-outline',
    accent: 'info',
    subtitle: 'Application update',
  },
  application_selected: {
    icon: 'checkmark-circle-outline',
    accent: 'success',
    subtitle: 'You have been selected',
  },
  application_rejected: {
    icon: 'close-circle-outline',
    accent: 'destructive',
    subtitle: 'Application update',
  },
  application_hired: {
    icon: 'checkmark-circle-outline',
    accent: 'success',
    subtitle: 'Shift confirmed',
  },
  fill_in_posted: {
    icon: 'calendar-outline',
    accent: 'urgent',
    subtitle: 'New fill-in',
  },
  job_posted: {
    icon: 'briefcase-outline',
    accent: 'secondary',
    subtitle: 'New role',
  },
  message_received: {
    icon: 'chatbubble-outline',
    accent: 'primary',
    subtitle: 'New message',
  },
};

const DEFAULT_META: NotificationDisplayMeta = {
  icon: 'notifications-outline',
  accent: 'primary',
  subtitle: 'Update',
};

export function getNotificationDisplayMeta(notificationId: string | undefined): NotificationDisplayMeta {
  if (!notificationId) return DEFAULT_META;
  return TYPE_META[notificationId] ?? DEFAULT_META;
}

export function getNotificationAccentColor(colors: Colors, accent: NotificationAccent): string {
  switch (accent) {
    case 'success':
      return colors.success;
    case 'destructive':
      return colors.destructive;
    case 'secondary':
      return colors.secondary;
    case 'urgent':
      return colors.urgent;
    case 'info':
      return colors.info;
    default:
      return colors.primary;
  }
}

export function getNotificationAccentBackground(
  colors: Colors,
  accent: NotificationAccent,
): string {
  switch (accent) {
    case 'success':
      return colors.primarySubtle;
    case 'destructive':
      return `${colors.destructive}14`;
    case 'secondary':
      return colors.secondarySubtle;
    case 'urgent':
      return `${colors.urgent}18`;
    case 'info':
      return `${colors.info}14`;
    default:
      return colors.primarySubtle;
  }
}

function relativeUnit(value: number, unit: string): string {
  const abs = Math.abs(value);
  const label = abs === 1 ? unit : `${unit}s`;
  if (value < 0) return `${abs} ${label} ago`;
  if (value === 0) return 'Just now';
  return `in ${abs} ${label}`;
}

/** iOS-style relative timestamp (e.g. "Just now", "5m ago", "Yesterday"). */
export function formatNotificationTime(isoDate: string | undefined): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  const now = Date.now();
  const diffSec = Math.round((date.getTime() - now) / 1000);
  const absSec = Math.abs(diffSec);

  if (absSec < 45) return 'Just now';
  if (absSec < 3600) return relativeUnit(Math.round(diffSec / 60), 'min');
  if (absSec < 86400) return relativeUnit(Math.round(diffSec / 3600), 'hr');

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  if (absSec < 604800) return relativeUnit(Math.round(diffSec / 86400), 'day');

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
