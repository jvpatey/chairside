export const MOBILE_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['index', 'fillins', 'browse', 'applications', 'calendar', 'messages'],
  clinic: ['index', 'fill-ins', 'postings', 'applications', 'calendar', 'messages'],
};

export const TABLET_SIDEBAR_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['index', 'fillins', 'browse', 'applications', 'calendar', 'messages'],
  clinic: ['index', 'fill-ins', 'postings', 'applications', 'discover', 'calendar', 'messages'],
};

export type SidebarSection = {
  label: string | null;
  routes: string[];
};

export const TABLET_SIDEBAR_SECTIONS: Record<'worker' | 'clinic', SidebarSection[]> = {
  worker: [
    { label: null, routes: ['index', 'fillins', 'browse', 'applications'] },
    { label: null, routes: ['calendar', 'messages'] },
  ],
  clinic: [
    { label: null, routes: ['index', 'fill-ins', 'postings', 'applications'] },
    { label: null, routes: ['discover', 'calendar', 'messages'] },
  ],
};

/** Hiring destinations that should read heavier in the expanded web sidebar. */
export function isEmphasizedSidebarRoute(routeName: string): boolean {
  return (
    routeName === 'fill-ins' ||
    routeName === 'fillins' ||
    routeName === 'postings' ||
    routeName === 'browse'
  );
}
