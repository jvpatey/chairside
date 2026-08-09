export const MOBILE_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['index', 'browse', 'applications', 'fillins', 'calendar', 'messages'],
  clinic: ['index', 'postings', 'applications', 'fill-ins', 'calendar', 'messages'],
};

export const TABLET_SIDEBAR_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['index', 'browse', 'applications', 'fillins', 'calendar', 'messages'],
  clinic: ['index', 'postings', 'applications', 'fill-ins', 'discover', 'calendar', 'messages'],
};

export type SidebarSection = {
  label: string | null;
  routes: string[];
};

export const TABLET_SIDEBAR_SECTIONS: Record<'worker' | 'clinic', SidebarSection[]> = {
  worker: [
    { label: null, routes: ['index', 'browse', 'applications', 'fillins'] },
    { label: null, routes: ['calendar', 'messages'] },
  ],
  clinic: [
    { label: null, routes: ['index', 'postings', 'applications', 'fill-ins'] },
    { label: null, routes: ['discover', 'calendar', 'messages'] },
  ],
};
