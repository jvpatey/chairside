/** Default avatar size for `BrowseListRow` and grouped list inset dividers. */
export const browseListRowAvatarSize = 40;

/** Left inset for grouped list dividers — aligns with the text column after the avatar. */
export function browseListRowTextInset(spacingMd: number): number {
  return spacingMd + browseListRowAvatarSize + spacingMd;
}
