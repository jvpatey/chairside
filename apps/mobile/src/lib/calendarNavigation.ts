import type { Href } from 'expo-router';

import {
  getClinicCalendarSidebarRoute,
  getWorkerCalendarSidebarRoute,
} from '@/lib/routing';

export function getWorkerCalendarRoute(date?: string): Href {
  return getWorkerCalendarSidebarRoute(date);
}

export function getClinicCalendarRoute(date?: string): Href {
  return getClinicCalendarSidebarRoute(date);
}

export function redirectEmbeddedCalendarDeepLink(
  mode: string | undefined,
  date: string | undefined,
  role: 'worker' | 'clinic',
): Href | null {
  if (mode !== 'calendar') return null;
  return role === 'worker'
    ? getWorkerCalendarSidebarRoute(date)
    : getClinicCalendarSidebarRoute(date);
}
