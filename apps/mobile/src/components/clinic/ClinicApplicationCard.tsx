import { updateApplicationStatus, type ClinicApplication } from '@chairside/api';
import {
  formatApplicationEducation,
  formatClinicApplicationStatus,
  formatApplicationResumeStatus,
  getRoleTypeLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { calculateMatchScore } from '@chairside/core';
import { Alert, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { openResumePreview } from '@/lib/openResumePreview';
import { useThemedStyles } from '@/theme';

type ClinicApplicationCardProps = {
  application: ClinicApplication;
  onUpdated?: () => void;
};

export function ClinicApplicationCard({ application, onUpdated }: ClinicApplicationCardProps) {
  const photoUri = useWorkerPhotoUri(application.worker_photo_storage_path);
  const breakdown = calculateMatchScore({
    postRoleType: application.post_role_type,
    workerRoleType: application.role_type,
  });
  const score = application.match_score ?? breakdown.overall;

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
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 1,
    },
    statusBadgeNew: {
      backgroundColor: colors.primarySubtle,
    },
    statusBadgeViewed: {
      backgroundColor: colors.secondarySubtle,
    },
    statusBadgeInProgress: {
      backgroundColor: `${colors.info}18`,
    },
    statusBadgeSelected: {
      backgroundColor: colors.primarySubtle,
    },
    statusBadgeDeclined: {
      backgroundColor: `${colors.destructive}18`,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    statusBadgeTextNew: { color: colors.primary },
    statusBadgeTextViewed: { color: colors.secondary },
    statusBadgeTextInProgress: { color: colors.info },
    statusBadgeTextSelected: { color: colors.primary },
    statusBadgeTextDeclined: { color: colors.destructive },
    meta: typography.subtitle,
    score: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
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

  const handleViewResume = async () => {
    if (!application.resume_storage_path) return;
    try {
      await openResumePreview(
        application.resume_storage_path,
        `${application.post_title}-resume.pdf`,
      );
    } catch (error) {
      Alert.alert(
        'Could not open resume',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const statusLabel = formatClinicApplicationStatus(application.status);
  const statusVariant =
    application.status === 'applied'
      ? 'new'
      : application.status === 'reviewed'
        ? 'viewed'
        : application.status === 'in_progress'
          ? 'inProgress'
          : application.status === 'selected'
            ? 'selected'
            : application.status === 'rejected'
              ? 'declined'
              : 'viewed';

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
            <View
              style={[
                styles.statusBadge,
                statusVariant === 'new'
                  ? styles.statusBadgeNew
                  : statusVariant === 'viewed'
                    ? styles.statusBadgeViewed
                    : statusVariant === 'inProgress'
                      ? styles.statusBadgeInProgress
                      : statusVariant === 'selected'
                        ? styles.statusBadgeSelected
                        : styles.statusBadgeDeclined,
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  statusVariant === 'new'
                    ? styles.statusBadgeTextNew
                    : statusVariant === 'viewed'
                      ? styles.statusBadgeTextViewed
                      : statusVariant === 'inProgress'
                        ? styles.statusBadgeTextInProgress
                        : statusVariant === 'selected'
                          ? styles.statusBadgeTextSelected
                          : styles.statusBadgeTextDeclined,
                ]}>
                {statusLabel}
              </Text>
            </View>
          </View>
          {application.worker_address ? (
            <Text style={styles.meta}>{application.worker_address}</Text>
          ) : null}
        </View>
      </View>
      <Text style={styles.score}>Match score: {score}%</Text>
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
      <Text style={styles.meta}>
        Resume · {formatApplicationResumeStatus(application.resume_storage_path)}
      </Text>
      {application.resume_storage_path ? (
        <OnboardingButton label="View resume" variant="secondary" onPress={() => void handleViewResume()} />
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
