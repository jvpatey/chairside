export const MOBILE_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['index', 'browse', 'applications', 'calendar', 'fillins', 'messages'],
  clinic: ['index', 'postings', 'applications', 'calendar', 'fill-ins', 'messages'],
};

export const TABLET_SIDEBAR_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['index', 'browse', 'applications', 'calendar', 'fillins', 'messages'],
  clinic: ['index', 'postings', 'applications', 'calendar', 'fill-ins', 'messages'],
};

export type SidebarSection = {
  label: string | null;
  routes: string[];
};

export const TABLET_SIDEBAR_SECTIONS: Record<'worker' | 'clinic', SidebarSection[]> = {
  worker: [
    { label: null, routes: ['index', 'browse', 'applications'] },
    { label: null, routes: ['calendar', 'fillins', 'messages'] },
  ],
  clinic: [
    { label: null, routes: ['index', 'postings', 'applications'] },
    { label: null, routes: ['calendar', 'fill-ins', 'messages'] },
  ],
};
