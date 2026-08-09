import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { ClinicRoleApplicantsPanel } from '@/components/clinic/ClinicRoleApplicantsPanel';
import {
  navigateAfterRoleApplicants,
  type ClinicApplicationReturnTarget,
} from '@/lib/routing';

export default function ClinicRoleApplicationsScreen() {
  const { jobId, returnTo } = useLocalSearchParams<{
    jobId?: string;
    returnTo?: string;
  }>();
  const resolvedJobId = typeof jobId === 'string' ? jobId : '';
  const resolvedReturnTo =
    typeof returnTo === 'string' ? (returnTo as ClinicApplicationReturnTarget) : undefined;

  const goBack = useCallback(() => {
    navigateAfterRoleApplicants(router, resolvedReturnTo);
  }, [resolvedReturnTo]);

  if (!resolvedJobId) {
    return null;
  }

  return (
    <ClinicRoleApplicantsPanel
      jobId={resolvedJobId}
      returnTo={resolvedReturnTo}
      onBack={goBack}
      onLoadError={goBack}
    />
  );
}
