export const MOBILE_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['browse', 'applications', 'index', 'fillins', 'messages'],
  clinic: ['postings', 'applications', 'index', 'fill-ins', 'messages'],
};

export const TABLET_SIDEBAR_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['index', 'browse', 'applications', 'fillins', 'messages'],
  clinic: ['index', 'postings', 'applications', 'fill-ins', 'messages'],
};
