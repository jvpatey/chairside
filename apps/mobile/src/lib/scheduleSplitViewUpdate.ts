/**
 * Schedule MessageSplitView state updates outside the React render/commit of
 * inbox children. Calling parent setState from a child effect can still trip
 * "Cannot update a component while rendering a different component" on RN/iPad.
 */
export function scheduleSplitViewUpdate(update: () => void): void {
  setTimeout(update, 0);
}
