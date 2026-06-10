export const TABLET_SIDEBAR_WIDTH = 240;
export const TABLET_SIDEBAR_COLLAPSED_WIDTH = 76;

export function getTabletSidebarWidth(collapsed: boolean): number {
  return collapsed ? TABLET_SIDEBAR_COLLAPSED_WIDTH : TABLET_SIDEBAR_WIDTH;
}
