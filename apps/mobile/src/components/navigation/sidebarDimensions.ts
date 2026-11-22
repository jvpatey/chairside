/** Slimmer expanded rail — worker Home is sparse; wide chrome overpowers content. */
export const TABLET_SIDEBAR_WIDTH = 168;
export const TABLET_SIDEBAR_COLLAPSED_WIDTH = 72;

export function getTabletSidebarWidth(collapsed: boolean): number {
  return collapsed ? TABLET_SIDEBAR_COLLAPSED_WIDTH : TABLET_SIDEBAR_WIDTH;
}
