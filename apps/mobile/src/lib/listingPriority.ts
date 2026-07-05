/** Pro clinics first; stable tie when both have the same priority tier. */
export function comparePriorityListingDesc(
  a: { has_priority_listing: boolean },
  b: { has_priority_listing: boolean },
): number {
  const left = a.has_priority_listing ? 1 : 0;
  const right = b.has_priority_listing ? 1 : 0;
  return right - left;
}

export function sortWithPriorityFirst<T extends { has_priority_listing: boolean }>(
  items: T[],
  secondarySort: (left: T, right: T) => number,
): T[] {
  return [...items].sort((left, right) => {
    const priorityCompare = comparePriorityListingDesc(left, right);
    if (priorityCompare !== 0) return priorityCompare;
    return secondarySort(left, right);
  });
}
