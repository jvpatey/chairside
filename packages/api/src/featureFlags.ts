/**
 * Product feature flags.
 * Clinic groups can be disabled with EXPO_PUBLIC_CLINIC_GROUPS_ENABLED=0|false|off.
 */
export function isClinicGroupsEnabled(): boolean {
  const raw = process.env.EXPO_PUBLIC_CLINIC_GROUPS_ENABLED?.trim().toLowerCase();
  if (!raw) return true;
  return raw !== '0' && raw !== 'false' && raw !== 'off' && raw !== 'no';
}
