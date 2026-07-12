import { usePathname } from 'expo-router';
import { useMemo } from 'react';

import { useWebDocumentTitle } from '@/hooks/useWebDocumentTitle';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Chairside',
  '/welcome': 'Chairside — Dental staffing, simplified',
  '/privacy': 'Chairside — Privacy Policy',
  '/terms': 'Chairside — Terms of Service',
  '/support': 'Chairside — Support',
};

function titleForPath(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];

  if (pathname.includes('/browse')) return 'Chairside — Roles';
  if (pathname.includes('/applications')) return 'Chairside — Applications';
  if (pathname.includes('/fillins') || pathname.includes('/fill-ins')) return 'Chairside — Fill-ins';
  if (pathname.includes('/messages')) return 'Chairside — Messages';
  if (pathname.includes('/postings')) return 'Chairside — Roles';
  if (pathname.includes('/post-job')) return 'Chairside — Post a role';
  if (pathname.includes('/post-shift')) return 'Chairside — Post a fill-in';
  if (pathname.includes('/profile')) return 'Chairside — Settings';
  if (pathname.includes('/sign-in')) return 'Chairside — Sign in';
  if (pathname.includes('/sign-up')) return 'Chairside — Sign up';
  if (pathname.includes('/role')) return 'Chairside — Get started';

  if (pathname.endsWith('/index') || pathname.match(/\/\([^)]+\)$/)) {
    return 'Chairside — Dashboard';
  }

  return 'Chairside';
}

/** Syncs document.title with the current route on web. */
export function WebDocumentTitleManager() {
  const pathname = usePathname();
  const title = useMemo(() => titleForPath(pathname), [pathname]);
  useWebDocumentTitle(title);
  return null;
}
