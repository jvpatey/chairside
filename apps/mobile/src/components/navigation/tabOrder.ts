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
    { label: 'Workspace', routes: ['index', 'browse', 'applications'] },
    { label: 'Schedule', routes: ['calendar', 'fillins'] },
    { label: null, routes: ['messages'] },
  ],
  clinic: [
    { label: 'Workspace', routes: ['index', 'postings', 'applications'] },
    { label: 'Schedule', routes: ['calendar', 'fill-ins'] },
    { label: null, routes: ['messages'] },
  ],
};
