import { updateApplicationStatus, type ClinicApplication } from '@chairside/api';
import {
  formatApplicationEducation,
  formatApplicationResumeStatus,
  getRoleTypeLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { Alert, Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { ApplicationScreeningSection } from '@/components/clinic/ApplicationScreeningSection';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { ResumeViewButton } from '@/components/ui/ResumeViewButton';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import { buildResumeFileName } from '@/lib/openResumePreview';
import { useThemedStyles } from '@/theme';

type ClinicApplicationCardProps = {
  application: ClinicApplication;
  onUpdated?: () => void;
};

export function ClinicApplicationCard({ application, onUpdated }: ClinicApplicationCardProps) {
  const photoUri = useWorkerPhotoUri(application.worker_photo_storage_path);
  const isJob = application.post_type === 'job';
  const jobMatch = isJob ? parseApplicationJobMatch(application) : null;
  const matchContext = isJob ? getApplicationMatchDisplayContext(application) : null;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    applicantName: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 17,
    },
    applicantHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    applicantHeaderText: { flex: 1, gap: 2 },
    applicantTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    meta: typography.subtitle,
    actions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    action: { flex: 1 },
  }));

  const updateStatus = async (status: Parameters<typeof updateApplicationStatus>[1]) => {
    try {
      await updateApplicationStatus(application.id, status);
      onUpdated?.();
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const resumeFileName = buildResumeFileName({
    workerDisplayName: application.worker_display_name,
    postTitle: application.post_title,
  });

  return (
    <View style={styles.card}>
      <View style={styles.applicantHeader}>
        <WorkerProfileAvatar
          displayName={application.worker_display_name}
          photoUri={photoUri}
          size={44}
        />
        <View style={styles.applicantHeaderText}>
          <View style={styles.applicantTitleRow}>
            {application.worker_display_name ? (
              <Text style={[styles.applicantName, { flex: 1 }]}>
                {application.worker_display_name}
              </Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <ClinicApplicationStatusBadge status={application.status} />
          </View>
          {application.worker_address ? (
            <Text style={styles.meta}>{application.worker_address}</Text>
          ) : null}
        </View>
      </View>
      {jobMatch && matchContext ? (
        <BadgeRow>
          <MatchTierBadge
            breakdown={jobMatch}
            context={matchContext}
            subtitle={application.post_title}
            audience="clinic"
          />
        </BadgeRow>
      ) : null}
      {application.years_of_experience != null || application.education ? (
        <Text style={styles.meta}>
          {application.years_of_experience != null
            ? `${application.years_of_experience} yrs`
            : ''}
          {application.years_of_experience != null && application.education ? ' · ' : ''}
          {formatApplicationEducation(application.education)}
        </Text>
      ) : null}
      {application.role_type ? (
        <Text style={styles.meta}>{getRoleTypeLabel(application.role_type)}</Text>
      ) : null}
      {(application.software_used ?? []).length > 0 ? (
        <Text style={styles.meta}>Software: {(application.software_used ?? []).join(', ')}</Text>
      ) : null}
      {(application.practice_types ?? []).length > 0 ? (
        <Text style={styles.meta}>
          Specialties: {(application.practice_types ?? []).map(getSpecialtyLabel).join(', ')}
        </Text>
      ) : null}
      {application.cover_message ? (
        <Text style={styles.meta}>{application.cover_message}</Text>
      ) : null}
      {application.post_type === 'job' && application.screening ? (
        <ApplicationScreeningSection screening={application.screening} />
      ) : null}
      <Text style={styles.meta}>
        Resume · {formatApplicationResumeStatus(application.resume_storage_path)}
      </Text>
      {application.resume_storage_path ? (
        <ResumeViewButton
          storagePath={application.resume_storage_path}
          fileName={resumeFileName}
        />
      ) : null}
      {(application.status === 'applied' ||
        application.status === 'reviewed' ||
        application.status === 'in_progress') && (
        <View style={styles.actions}>
          {application.status === 'applied' ? (
            <>
              <OnboardingButton label="Mark as viewed" onPress={() => void updateStatus('reviewed')} />
              <OnboardingButton
                label="Decline"
                variant="secondary"
                onPress={() => void updateStatus('rejected')}
              />
            </>
          ) : null}
          {application.status === 'reviewed' ? (
            <OnboardingButton
              label="Mark in progress"
              onPress={() => void updateStatus('in_progress')}
            />
          ) : null}
          {application.status === 'in_progress' ? (
            <View style={styles.actionsRow}>
              <OnboardingButton
                style={styles.action}
                label="Mark as selected"
                onPress={() => void updateStatus('selected')}
              />
              <OnboardingButton
                style={styles.action}
                label="Decline"
                variant="secondary"
                onPress={() => void updateStatus('rejected')}
              />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}
