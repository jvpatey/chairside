export const TABLET_SIDEBAR_WIDTH = 200;
export const TABLET_SIDEBAR_COLLAPSED_WIDTH = 72;

export function getTabletSidebarWidth(collapsed: boolean): number {
  return collapsed ? TABLET_SIDEBAR_COLLAPSED_WIDTH : TABLET_SIDEBAR_WIDTH;
}
