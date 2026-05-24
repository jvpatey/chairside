import { getWorkerResumeSignedUrl, listClinicApplications, updateApplicationStatus, type ClinicApplication } from '@chairside/api';
import { calculateMatchScore } from '@chairside/core';
import { getSpecialtyLabel } from '@chairside/config';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/theme';

function ApplicationCard({
  application,
  onShortlist,
  onReject,
}: {
  application: ClinicApplication;
  onShortlist: () => void;
  onReject: () => void;
}) {
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
    title: {
      ...typography.body,
      fontWeight: '600',
    },
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
    resumeLink: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  }));

  const handleViewResume = async () => {
    if (!application.resume_storage_path) return;
    try {
      const url = await getWorkerResumeSignedUrl(application.resume_storage_path);
      if (!url) {
        Alert.alert('Resume unavailable', 'Could not open this resume.');
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'Could not open resume',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{application.post_title}</Text>
      <Text style={styles.meta}>
        {application.post_type === 'job' ? 'Role application' : 'Fill-in application'} ·{' '}
        {application.status}
      </Text>
      <Text style={styles.score}>Match score: {score}%</Text>
      {application.years_of_experience != null || application.education ? (
        <Text style={styles.meta}>
          {application.years_of_experience != null
            ? `${application.years_of_experience} yrs`
            : ''}
          {application.years_of_experience != null && application.education ? ' · ' : ''}
          {application.education ?? ''}
        </Text>
      ) : null}
      {application.role_type ? (
        <Text style={styles.meta}>{application.role_type}</Text>
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
      {application.resume_storage_path ? (
        <Pressable onPress={() => void handleViewResume()}>
          <Text style={styles.resumeLink}>View resume</Text>
        </Pressable>
      ) : null}
      {application.status === 'applied' ? (
        <View style={styles.actions}>
          <OnboardingButton style={styles.action} label="Shortlist" onPress={onShortlist} />
          <OnboardingButton
            style={styles.action}
            label="Reject"
            variant="secondary"
            onPress={onReject}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function ClinicApplicationsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ClinicApplication[]>([]);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    list: { gap: spacing.md },
    empty: typography.subtitle,
  }));

  const load = useCallback(async () => {
    if (!user?.id) {
      setApplications([]);
      return;
    }

    try {
      const rows = await listClinicApplications(user.id);
      setApplications(rows);
    } catch (error) {
      setApplications([]);
      Alert.alert(
        'Could not load applications',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (applicationId: string, status: 'shortlisted' | 'rejected') => {
    try {
      await updateApplicationStatus(applicationId, status);
      await load();
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  return (
    <Screen title="Applications" subtitle="Candidates across your postings.">
      {applications.length === 0 ? (
        <Text style={styles.empty}>
          No applications yet. They will appear here when workers apply to your postings.
        </Text>
      ) : (
        <View style={styles.list}>
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onShortlist={() => void updateStatus(application.id, 'shortlisted')}
              onReject={() => void updateStatus(application.id, 'rejected')}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
