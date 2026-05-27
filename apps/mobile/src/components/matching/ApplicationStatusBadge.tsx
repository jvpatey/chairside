import type { ApplicationStatus } from '@chairside/api';
import {
  formatApplicationStatus,
  formatClinicApplicationStatus,
  type ApplicationPostType,
} from '@chairside/config';

import { PillBadge } from '@/components/ui/PillBadge';
import { useTheme } from '@/theme';

export type ApplicationStatusVariant =
  | 'applied'
  | 'viewed'
  | 'inProgress'
  | 'interviewScheduled'
  | 'selected'
  | 'rejected';

export function getWorkerApplicationStatusVariant(
  status: ApplicationStatus | string,
): ApplicationStatusVariant {
  if (status === 'reviewed') return 'viewed';
  if (status === 'in_progress') return 'inProgress';
  if (status === 'interview_scheduled') return 'interviewScheduled';
  if (status === 'rejected') return 'rejected';
  if (status === 'selected' || status === 'hired') return 'selected';
  return 'applied';
}

export function getClinicApplicationStatusVariant(
  status: ApplicationStatus | string,
): ApplicationStatusVariant {
  if (status === 'applied') return 'applied';
  if (status === 'reviewed') return 'viewed';
  if (status === 'in_progress') return 'inProgress';
  if (status === 'interview_scheduled') return 'interviewScheduled';
  if (status === 'selected' || status === 'hired') return 'selected';
  if (status === 'rejected') return 'rejected';
  return 'viewed';
}

function useStatusVariantPalette(variant: ApplicationStatusVariant) {
  const { colors } = useTheme();

  switch (variant) {
    case 'viewed':
      return { color: colors.secondary, backgroundColor: colors.secondarySubtle };
    case 'inProgress':
      return { color: colors.info, backgroundColor: `${colors.info}18` };
    case 'interviewScheduled':
      return { color: colors.secondary, backgroundColor: colors.secondarySubtle };
    case 'rejected':
      return { color: colors.destructive, backgroundColor: `${colors.destructive}18` };
    case 'selected':
    case 'applied':
    default:
      return { color: colors.primary, backgroundColor: colors.primarySubtle };
  }
}

type ApplicationStatusBadgeProps = {
  label: string;
  variant: ApplicationStatusVariant;
};

export function ApplicationStatusBadge({ label, variant }: ApplicationStatusBadgeProps) {
  const palette = useStatusVariantPalette(variant);
  return (
    <PillBadge
      label={label}
      color={palette.color}
      backgroundColor={palette.backgroundColor}
    />
  );
}

type WorkerApplicationStatusBadgeProps = {
  status: ApplicationStatus | string;
  postType: ApplicationPostType;
};

export function WorkerApplicationStatusBadge({
  status,
  postType,
}: WorkerApplicationStatusBadgeProps) {
  return (
    <ApplicationStatusBadge
      label={formatApplicationStatus(status, postType)}
      variant={getWorkerApplicationStatusVariant(status)}
    />
  );
}

type ClinicApplicationStatusBadgeProps = {
  status: ApplicationStatus | string;
};

export function ClinicApplicationStatusBadge({ status }: ClinicApplicationStatusBadgeProps) {
  return (
    <ApplicationStatusBadge
      label={formatClinicApplicationStatus(status)}
      variant={getClinicApplicationStatusVariant(status)}
    />
  );
}

export function AppliedPillBadge() {
  const { colors } = useTheme();
  return (
    <PillBadge label="Applied" color={colors.primary} backgroundColor={colors.primarySubtle} />
  );
}
