/** Slimmer expanded rail — worker Home is sparse; wide chrome overpowers content. */
export const TABLET_SIDEBAR_WIDTH = 168;
/** Wide enough for stacked "chair" / "side" at the same wordmark size (no shrink). */
export const TABLET_SIDEBAR_COLLAPSED_WIDTH = 88;

export function getTabletSidebarWidth(collapsed: boolean): number {
  return collapsed ? TABLET_SIDEBAR_COLLAPSED_WIDTH : TABLET_SIDEBAR_WIDTH;
}
