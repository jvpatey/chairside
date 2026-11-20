/** Primary destinations. Profile stays a hidden stack, opened from hero / sidebar account. */
export const MOBILE_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['index', 'fillins', 'browse'],
  clinic: ['index', 'fill-ins', 'postings'],
};

export const TABLET_SIDEBAR_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['index', 'fillins', 'browse'],
  clinic: ['index', 'fill-ins', 'postings'],
};

export type SidebarSection = {
  label: string | null;
  routes: string[];
};

export const TABLET_SIDEBAR_SECTIONS: Record<'worker' | 'clinic', SidebarSection[]> = {
  worker: [{ label: null, routes: ['index', 'fillins', 'browse'] }],
  clinic: [{ label: null, routes: ['index', 'fill-ins', 'postings'] }],
};
