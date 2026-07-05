export type TabAtmosphereRole = 'worker' | 'clinic';

export type TabAtmosphereIntensity = 'none' | 'subtle' | 'prominent';

export type TabAtmosphereAccent = 'primary' | 'secondary';

const WORKER_MAIN_TABS = new Set(['browse', 'applications', 'calendar', 'fillins', 'messages']);
const CLINIC_MAIN_TABS = new Set(['postings', 'applications', 'calendar', 'fill-ins', 'messages']);

const WORKER_STACK_FRAGMENTS = [
  '/job/',
  '/shift/',
  '/application/',
  '/conversation/',
  '/apply',
  '/open-fill-ins',
  '/past-fill-ins',
  '/fill-in-availability',
] as const;

const CLINIC_STACK_FRAGMENTS = [
  '/job/',
  '/shift/',
  '/application/',
  '/conversation/',
  '/post-job',
  '/post-shift',
  '/role-applicants/',
  '/shift-applicants/',
  '/role-history',
  '/clinic',
] as const;

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : '/';
}

function stripTabGroupPrefix(path: string, role: TabAtmosphereRole): string {
  const workerPrefix = '/(tabs)';
  const clinicPrefix = '/(clinic-tabs)';

  if (role === 'worker' && path.startsWith(workerPrefix)) {
    const rest = path.slice(workerPrefix.length);
    return rest.length > 0 ? rest : '/';
  }

  if (role === 'clinic' && path.startsWith(clinicPrefix)) {
    const rest = path.slice(clinicPrefix.length);
    return rest.length > 0 ? rest : '/';
  }

  return path;
}

function isStackDetailPath(path: string, role: TabAtmosphereRole): boolean {
  const fragments = role === 'worker' ? WORKER_STACK_FRAGMENTS : CLINIC_STACK_FRAGMENTS;
  return fragments.some((fragment) => path.includes(fragment));
}

function isHomePath(relativePath: string): boolean {
  return relativePath === '/' || relativePath === '/index';
}

function isProfilePath(relativePath: string): boolean {
  return relativePath === '/profile' || relativePath.startsWith('/profile/');
}

function isFillInOutreachPath(relativePath: string): boolean {
  return (
    relativePath === '/find-available-workers' ||
    relativePath.startsWith('/outreach-compose')
  );
}

/** Stack routes that keep the shell atmosphere visible (including behind the sidebar). */
function isAtmosphereStackPath(relativePath: string): boolean {
  const root = relativePath.split('/').filter(Boolean)[0];
  if (!root) return false;

  return (
    root === 'job' ||
    root === 'role-applicants' ||
    root === 'application' ||
    root === 'shift' ||
    root === 'shift-applicants' ||
    root === 'role-history' ||
    root === 'post-job' ||
    root === 'post-shift' ||
    root === 'apply' ||
    root === 'open-fill-ins' ||
    root === 'past-fill-ins' ||
    root === 'fill-in-availability'
  );
}

function getTabBarNameFromReturnTo(
  returnTo: string | undefined,
  role: TabAtmosphereRole,
): string | null {
  if (!returnTo) return null;

  if (
    returnTo === 'applications-tab' ||
    returnTo === 'dashboard-applications'
  ) {
    return returnTo === 'dashboard-applications' ? 'index' : 'applications';
  }

  if (returnTo === 'messages-tab') {
    return 'messages';
  }

  if (returnTo === 'calendar-tab') {
    return 'calendar';
  }

  if (returnTo === 'browse-tab') {
    return 'browse';
  }

  if (
    returnTo === 'fill-ins-tab' ||
    returnTo === 'open-fill-ins' ||
    returnTo === 'past-fill-ins'
  ) {
    return role === 'worker' ? 'fillins' : 'fill-ins';
  }

  if (returnTo === 'dashboard-fill-ins') {
    return 'index';
  }

  if (returnTo === 'postings-tab' || returnTo === 'role-history') {
    return 'postings';
  }

  if (returnTo === 'postings-fill-ins') {
    return role === 'worker' ? 'fillins' : 'postings';
  }

  return null;
}

function getStackParentTabFromRelativePath(
  relativePath: string,
  role: TabAtmosphereRole,
): string | null {
  const segments = relativePath.split('/').filter(Boolean);
  const root = segments[0];
  if (!root) return null;

  if (root === 'application') return 'applications';
  if (root === 'role-applicants') return 'applications';
  if (root === 'conversation') return 'messages';
  if (root === 'shift-applicants') return role === 'worker' ? 'fillins' : 'fill-ins';

  if (root === 'job' || root === 'post-job' || root === 'role-history') {
    return role === 'worker' ? 'browse' : 'postings';
  }

  if (
    root === 'shift' ||
    root === 'post-shift' ||
    root === 'find-available-workers' ||
    root === 'outreach-compose'
  ) {
    return role === 'worker' ? 'fillins' : 'fill-ins';
  }

  if (root === 'apply') return 'browse';
  if (root === 'open-fill-ins' || root === 'past-fill-ins' || root === 'fill-in-availability') {
    return 'fillins';
  }

  return null;
}

/** Resolve which tab bar item should appear selected for stack/detail routes. */
export function getActiveTabBarName(
  pathname: string,
  role: TabAtmosphereRole,
  returnTo?: string,
): string | null {
  const normalized = normalizePath(pathname);
  const relative = stripTabGroupPrefix(normalized, role);

  const mainTab = getMainTabFromRelativePath(relative, role);
  if (mainTab) return mainTab;

  const returnTab = getTabBarNameFromReturnTo(returnTo, role);
  if (returnTab) return returnTab;

  if (isStackDetailPath(normalized, role)) {
    return getStackParentTabFromRelativePath(relative, role);
  }

  return null;
}

/** True when the pathname is the top-level screen for a main tab (not a nested stack route). */
export function isTabRootPath(
  pathname: string,
  tabName: string,
  role: TabAtmosphereRole,
): boolean {
  const normalized = normalizePath(pathname);
  const relative = stripTabGroupPrefix(normalized, role);

  if (tabName === 'index') {
    return isHomePath(relative);
  }

  const mainTab = getMainTabFromRelativePath(relative, role);
  if (mainTab !== tabName) {
    return false;
  }

  const segments = relative.split('/').filter(Boolean);

  if (tabName === 'messages') {
    return segments.length === 1 || segments[1] === 'index';
  }

  return segments.length === 1;
}

function getMainTabFromRelativePath(
  relativePath: string,
  role: TabAtmosphereRole,
): string | null {
  const segments = relativePath.split('/').filter(Boolean);
  if (segments.length === 0) {
    return 'index';
  }

  const root = segments[0];
  const mainTabs = role === 'worker' ? WORKER_MAIN_TABS : CLINIC_MAIN_TABS;

  if (root === 'messages') {
    if (segments.length === 1) return 'messages';
    if (segments[1] === 'index' || segments[1] === 'clinics') return 'messages';
    return null;
  }

  if (segments.length === 1 && mainTabs.has(root)) {
    return root;
  }

  return null;
}

/** Derive atmosphere intensity from expo-router pathname (reliable on tab layouts). */
export function getTabAtmosphereIntensityFromPathname(
  pathname: string,
  role: TabAtmosphereRole,
): TabAtmosphereIntensity {
  const normalized = normalizePath(pathname);
  const relative = stripTabGroupPrefix(normalized, role);

  if (isStackDetailPath(normalized, role)) {
    return isAtmosphereStackPath(relative) ? 'subtle' : 'none';
  }

  if (isHomePath(relative)) {
    return 'prominent';
  }

  if (isProfilePath(relative)) {
    return 'subtle';
  }

  if (isFillInOutreachPath(relative)) {
    return 'subtle';
  }

  if (getMainTabFromRelativePath(relative, role)) {
    return 'subtle';
  }

  return 'none';
}

export function getTabAccentForName(tabName: string): TabAtmosphereAccent {
  return tabName === 'fillins' || tabName === 'fill-ins' ? 'secondary' : 'primary';
}

export function getTabAtmosphereAccentFromPathname(
  pathname: string,
  role: TabAtmosphereRole,
): TabAtmosphereAccent {
  const normalized = normalizePath(pathname);
  const relative = stripTabGroupPrefix(normalized, role);

  if (isFillInOutreachPath(relative)) {
    return 'secondary';
  }

  const mainTab = getMainTabFromRelativePath(relative, role);

  if (!mainTab && isStackDetailPath(normalized, role)) {
    const parentTab = getStackParentTabFromRelativePath(relative, role);
    if (parentTab) {
      return getTabAccentForName(parentTab);
    }
  }

  if (!mainTab) {
    return 'primary';
  }

  return getTabAccentForName(mainTab);
}

/** @deprecated Prefer `getTabAtmosphereIntensityFromPathname`. */
export function getTabAtmosphereIntensity(
  segments: string[],
  role: TabAtmosphereRole,
): TabAtmosphereIntensity {
  if (segments.length === 1) {
    const group = segments[0];
    if (role === 'worker' && group === '(tabs)') return 'prominent';
    if (role === 'clinic' && group === '(clinic-tabs)') return 'prominent';
  }

  const route = segments[1];
  if (!route) return 'none';

  const mainTabs = role === 'worker' ? WORKER_MAIN_TABS : CLINIC_MAIN_TABS;
  if (route === 'index') return 'prominent';
  if (!mainTabs.has(route)) return 'none';

  if (route === 'messages' && segments[2] && segments[2] !== 'index' && segments[2] !== 'clinics') {
    return 'none';
  }

  return 'subtle';
}
