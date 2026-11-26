/**
 * Group clinics always view exactly one location at a time. This resolves which
 * one: the stored/selected id when it is still accessible, otherwise the first
 * accessible location (locations are ordered primary-first).
 */
export function resolveActiveLocationId(
  selectedId: string | null | undefined,
  accessibleLocations: readonly { id: string }[],
): string | null {
  if (accessibleLocations.length === 0) return null;
  const match = selectedId
    ? accessibleLocations.find((location) => location.id === selectedId)
    : undefined;
  return (match ?? accessibleLocations[0]).id;
}
