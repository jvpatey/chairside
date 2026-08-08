const SCROLL_FADE_EDGE_PX = 2;

export type ScrollFadeState = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
};

/** Whether left/right edge fades should show for a horizontally scrollable chip row. */
export function computeScrollFadeState(
  scrollX: number,
  containerWidth: number,
  contentWidth: number,
): ScrollFadeState {
  if (containerWidth <= 0 || contentWidth <= containerWidth + SCROLL_FADE_EDGE_PX) {
    return { canScrollLeft: false, canScrollRight: false };
  }

  return {
    canScrollLeft: scrollX > SCROLL_FADE_EDGE_PX,
    canScrollRight: scrollX < contentWidth - containerWidth - SCROLL_FADE_EDGE_PX,
  };
}
