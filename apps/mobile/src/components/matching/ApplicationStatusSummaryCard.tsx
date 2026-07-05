import type { ApplicationStatus } from '@chairside/api';
import { View } from 'react-native';

import {
  ClinicApplicationStatusBadge,
  WorkerApplicationStatusBadge,
} from '@/components/matching/ApplicationStatusBadge';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import {
  getApplicationStatusSummary,
  type ApplicationStatusSummaryAudience,
  type ApplicationStatusSummaryInput,
} from '@/lib/applicationStatusSummary';
import { useThemedStyles } from '@/theme';

type ApplicationStatusSummaryCardProps = ApplicationStatusSummaryInput & {
  audience: ApplicationStatusSummaryAudience;
  isHighlighted?: boolean;
};

export function ApplicationStatusSummaryCard({
  audience,
  isHighlighted = false,
  status,
  postType,
  applicationKitRequestedAt,
  applicationKitSubmittedAt,
  interviewProposedAt,
  workerAccountDeleted,
  clinicAccountDeleted,
}: ApplicationStatusSummaryCardProps) {
  const summary = getApplicationStatusSummary(
    {
      status,
      postType,
      applicationKitRequestedAt,
      applicationKitSubmittedAt,
      interviewProposedAt,
      workerAccountDeleted,
      clinicAccountDeleted,
    },
    audience,
    { isHighlighted },
  );

  const styles = useThemedStyles(({ spacing }) => ({
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
  }));

  if (!summary) return null;

  return (
    <SurfaceCard padding="md" gap>
      <View style={styles.badgeRow}>
        {audience === 'worker' ? (
          <WorkerApplicationStatusBadge status={status as ApplicationStatus} postType={postType} />
        ) : (
          <ClinicApplicationStatusBadge
            status={status as ApplicationStatus}
            postType={postType}
            applicationKitRequestedAt={applicationKitRequestedAt}
            applicationKitSubmittedAt={applicationKitSubmittedAt}
          />
        )}
      </View>
      <CardInfoPanel variant={summary.variant} title={summary.headline}>
        <CardInfoPanelText>{summary.description}</CardInfoPanelText>
        {summary.nextStep ? <CardInfoPanelText>{summary.nextStep}</CardInfoPanelText> : null}
      </CardInfoPanel>
    </SurfaceCard>
  );
}
