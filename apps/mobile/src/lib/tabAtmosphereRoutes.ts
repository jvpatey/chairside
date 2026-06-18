export type TabAtmosphereRole = 'worker' | 'clinic';

export type TabAtmosphereIntensity = 'none' | 'subtle' | 'prominent';

export type TabAtmosphereAccent = 'primary' | 'secondary';

const WORKER_MAIN_TABS = new Set(['browse', 'applications', 'fillins', 'messages']);
const CLINIC_MAIN_TABS = new Set(['postings', 'applications', 'fill-ins', 'messages']);

const WORKER_STACK_FRAGMENTS = [
  '/job/',
  '/shift/',
  '/application/',
  '/conversation/',
  '/apply',
  '/open-fill-ins',
  '/past-fill-ins',
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
    return 'none';
  }

  if (isHomePath(relative)) {
    return 'prominent';
  }

  if (isProfilePath(relative)) {
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
  const mainTab = getMainTabFromRelativePath(relative, role);

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
