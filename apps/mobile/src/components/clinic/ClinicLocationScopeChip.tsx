import { ClinicLocationScopeSwitcher } from '@/components/clinic/ClinicLocationScopeSwitcher';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';

/** Compact scope trigger for tab headers (postings, fill-ins, applications, calendar). */
export function ClinicLocationScopeChip() {
  const { isGroup, accessibleLocations } = useClinicProfile();

  if (!isGroup || accessibleLocations.length <= 1) {
    return null;
  }

  return <ClinicLocationScopeSwitcher variant="hero" />;
}
