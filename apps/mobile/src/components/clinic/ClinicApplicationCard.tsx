import { updateApplicationStatus, type ClinicApplication } from '@chairside/api';
import { formatApplicationEducation, formatApplicationStatus, formatApplicationResumeStatus, getSpecialtyLabel } from '@chairside/config';
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
    meta: typography.subtitle,
    score: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    action: { flex: 1 },
  }));

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

  const handleMarkAsViewed = async () => {
    try {
      await updateApplicationStatus(application.id, 'reviewed');
      onUpdated?.();
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const handleMessage = () => {
    Alert.alert('Coming soon', 'Messaging applicants will be available in a future update.');
  };

  const handleReject = async () => {
    try {
      await updateApplicationStatus(application.id, 'rejected');
      onUpdated?.();
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.applicantHeader}>
        <WorkerProfileAvatar
          displayName={application.worker_display_name}
          photoUri={photoUri}
          size={44}
        />
        <View style={styles.applicantHeaderText}>
          {application.worker_display_name ? (
            <Text style={styles.applicantName}>{application.worker_display_name}</Text>
          ) : null}
          {application.worker_address ? (
            <Text style={styles.meta}>{application.worker_address}</Text>
          ) : null}
        </View>
      </View>
      <Text style={styles.meta}>Status · {formatApplicationStatus(application.status)}</Text>
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
      {application.role_type ? <Text style={styles.meta}>{application.role_type}</Text> : null}
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
      {application.status === 'applied' ? (
        <OnboardingButton label="Mark as viewed" onPress={() => void handleMarkAsViewed()} />
      ) : null}
      {application.status === 'applied' || application.status === 'reviewed' ? (
        <View style={styles.actions}>
          <OnboardingButton style={styles.action} label="Message" onPress={handleMessage} />
          <OnboardingButton
            style={styles.action}
            label="Reject"
            variant="secondary"
            onPress={() => void handleReject()}
          />
        </View>
      ) : null}
    </View>
  );
}
