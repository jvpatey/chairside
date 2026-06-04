import type { ApplicationStatus } from '@chairside/api';
import {
  formatApplicationStatus,
  formatClinicApplicationStatus,
  formatClinicScreeningStatus,
  type ApplicationPostType,
} from '@chairside/config';

import { PillBadge } from '@/components/ui/PillBadge';
import { useTheme } from '@/theme';

export type ApplicationStatusVariant =
  | 'applied'
  | 'screening'
  | 'viewed'
  | 'inProgress'
  | 'interviewOffered'
  | 'interviewScheduled'
  | 'selected'
  | 'confirmed'
  | 'rejected';

export function getWorkerApplicationStatusVariant(
  status: ApplicationStatus | string,
  postType?: ApplicationPostType,
): ApplicationStatusVariant {
  if (status === 'screening_submitted') return 'screening';
  if (status === 'reviewed') return 'viewed';
  if (status === 'in_progress') return 'inProgress';
  if (status === 'interview_offered') return 'interviewOffered';
  if (status === 'interview_scheduled') return 'interviewScheduled';
  if (status === 'rejected') return 'rejected';
  if (status === 'hired' && postType === 'shift') return 'confirmed';
  if (status === 'selected' || status === 'hired') return 'selected';
  return 'applied';
}

export function getClinicApplicationStatusVariant(
  status: ApplicationStatus | string,
  postType?: ApplicationPostType,
): ApplicationStatusVariant {
  if (status === 'screening_submitted') return 'screening';
  if (status === 'applied') return 'applied';
  if (status === 'reviewed') return 'viewed';
  if (status === 'in_progress') return 'inProgress';
  if (status === 'interview_offered') return 'interviewOffered';
  if (status === 'interview_scheduled') return 'interviewScheduled';
  if (status === 'hired' && postType === 'shift') return 'confirmed';
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
    case 'interviewOffered':
      return { color: colors.warning, backgroundColor: `${colors.warning}18` };
    case 'interviewScheduled':
      return { color: colors.secondary, backgroundColor: colors.secondarySubtle };
    case 'screening':
      return { color: colors.warning, backgroundColor: `${colors.warning}18` };
    case 'rejected':
      return { color: colors.destructive, backgroundColor: `${colors.destructive}18` };
    case 'confirmed':
      return { color: colors.success, backgroundColor: `${colors.success}18` };
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
      variant={getWorkerApplicationStatusVariant(status, postType)}
    />
  );
}

type ClinicApplicationStatusBadgeProps = {
  status: ApplicationStatus | string;
  postType?: ApplicationPostType;
  applicationKitRequestedAt?: string | null;
  applicationKitSubmittedAt?: string | null;
};

export function ClinicApplicationStatusBadge({
  status,
  postType,
  applicationKitRequestedAt,
  applicationKitSubmittedAt,
}: ClinicApplicationStatusBadgeProps) {
  const label =
    status === 'screening_submitted'
      ? formatClinicScreeningStatus({
          status,
          application_kit_requested_at: applicationKitRequestedAt,
          application_kit_submitted_at: applicationKitSubmittedAt,
        })
      : formatClinicApplicationStatus(status);

  return (
    <ApplicationStatusBadge
      label={label}
      variant={getClinicApplicationStatusVariant(status, postType)}
    />
  );
}

export function AppliedPillBadge() {
  const { colors } = useTheme();
  return (
    <PillBadge label="Applied" color={colors.primary} backgroundColor={colors.primarySubtle} />
  );
}

export function RequestedPillBadge() {
  const { colors } = useTheme();
  return (
    <PillBadge label="Requested" color={colors.primary} backgroundColor={colors.primarySubtle} />
  );
}
