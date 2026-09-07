import { ClinicLocationScopeSwitcher } from '@/components/clinic/ClinicLocationScopeSwitcher';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

/**
 * Scope trigger for tablet/desktop tab headers.
 * Phone uses the dashboard hero switcher instead.
 */
export function ClinicLocationScopeChip() {
  const { isTablet } = useResponsiveLayout();
  const { isGroup, accessibleLocations } = useClinicProfile();

  if (!isTablet || !isGroup || accessibleLocations.length <= 1) {
    return null;
  }

  return <ClinicLocationScopeSwitcher variant="hero" />;
}
