import { deleteApplication, type WorkerApplication } from '@chairside/api';
import {
  formatApplicationEducation,
  formatApplicationResumeStatus,
  isActiveApplicationStatus,
  getRoleTypeLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { Alert, Text, View } from 'react-native';

import {
  DetailProse,
  DetailRow,
  DetailSection,
  DetailSectionDivider,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { ResumeViewButton } from '@/components/ui/ResumeViewButton';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import { buildResumeFileName } from '@/lib/openResumePreview';
import { useThemedStyles } from '@/theme';

type WorkerApplicationDetailCardProps = {
  application: WorkerApplication;
  onViewPosting?: () => void;
  onCancelled?: () => void;
};

function formatAppliedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function WorkerApplicationDetailCard({
  application,
  onViewPosting,
  onCancelled,
}: WorkerApplicationDetailCardProps) {
  const canCancel = isActiveApplicationStatus(application.status);
  const isShift = application.post_type === 'shift';
  const jobMatch = !isShift ? parseApplicationJobMatch(application) : null;
  const matchContext = !isShift ? getApplicationMatchDisplayContext(application) : null;
  const clinicLocation = application.clinic_city ?? null;
  const softwareLabel =
    (application.software_used ?? []).length > 0
      ? application.software_used.join(', ')
      : null;
  const specialtiesLabel =
    (application.practice_types ?? []).length > 0
      ? application.practice_types.map(getSpecialtyLabel).join(', ')
      : null;
  const experienceLabel =
    application.years_of_experience != null
      ? `${application.years_of_experience} years`
      : null;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    hero: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    overline: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    clinicName: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    title: {
      ...typography.title,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.3,
    },
    location: typography.subtitle,
    badgeRow: {
      marginTop: spacing.xs,
    },
    appliedDate: {
      ...typography.subtitle,
      fontSize: 14,
    },
    body: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    kitCard: {
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    actionsSection: {
      gap: spacing.sm,
    },
    actionsLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    actionsGrid: {
      gap: spacing.sm,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionCell: {
      flex: 1,
    },
  }));

  const resumeFileName = buildResumeFileName({
    workerDisplayName: application.worker_display_name,
    postTitle: application.post_title,
  });

  const handleMessage = () => {
    Alert.alert('Coming soon', 'Messaging clinics will be available in a future update.');
  };

  const handleCancel = () => {
    Alert.alert(
      isShift ? 'Withdraw cover request?' : 'Cancel application?',
      isShift
        ? 'This removes your request from the clinic. You can request to cover again if the shift is still open.'
        : 'This removes your application from the clinic. You can apply again later if the posting is still open.',
      [
        { text: isShift ? 'Keep request' : 'Keep application', style: 'cancel' },
        {
          text: isShift ? 'Withdraw request' : 'Cancel application',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteApplication(application.worker_id, application.id);
                onCancelled?.();
              } catch (error) {
                Alert.alert(
                  isShift ? 'Could not withdraw request' : 'Could not cancel application',
                  error instanceof Error ? error.message : 'Please try again.',
                );
              }
            })();
          },
        },
      ],
    );
  };

  const primarySlots: {
    key: string;
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }[] = [
    {
      key: 'message',
      label: 'Message clinic',
      onPress: handleMessage,
    },
    {
      key: 'posting',
      label: application.post_type === 'job' ? 'View role' : 'View shift',
      onPress: () => onViewPosting?.(),
      disabled: !onViewPosting,
    },
  ];

  const secondarySlots: {
    key: string;
    label: string;
    variant: 'secondary' | 'destructive';
    onPress: () => void;
  }[] = [];

  if (canCancel) {
    secondarySlots.push({
      key: 'cancel',
      label: isShift ? 'Withdraw request' : 'Cancel application',
      variant: 'destructive',
      onPress: handleCancel,
    });
  }

  const actionRows = [0, 1].map((index) => ({
    primary: primarySlots[index] ?? null,
    secondary: secondarySlots[index] ?? null,
  }));

  const hasActions = actionRows.some((row) => row.primary || row.secondary);

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <Text style={styles.overline}>
          {isShift ? 'Cover request' : 'Role application'}
        </Text>
        <Text style={styles.clinicName}>{application.clinic_name}</Text>
        <Text style={styles.title}>{application.post_title}</Text>
        {clinicLocation ? <Text style={styles.location}>{clinicLocation}</Text> : null}
        <View style={styles.badgeRow}>
          <BadgeRow>
            <WorkerApplicationStatusBadge
              status={application.status}
              postType={application.post_type}
            />
            {jobMatch && matchContext ? (
              <MatchTierBadge
                breakdown={jobMatch}
                context={matchContext}
                subtitle={application.post_title}
              />
            ) : null}
          </BadgeRow>
        </View>
        <Text style={styles.appliedDate}>
          {isShift ? 'Requested' : 'Applied'} {formatAppliedDate(application.created_at)}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.kitCard}>
          <DetailSection title="What you submitted">
            <DetailRow label="Name" value={application.worker_display_name} />
            <RowDivider />
            <DetailRow label="Location" value={application.worker_address} />
            <RowDivider />
            <DetailRow
              label="Role"
              value={
                application.role_type ? getRoleTypeLabel(application.role_type) : null
              }
            />
            <RowDivider />
            <DetailRow label="Experience" value={experienceLabel} />
            <RowDivider />
            <DetailRow label="Education" value={formatApplicationEducation(application.education)} />
            <RowDivider />
            <DetailRow label="Software" value={softwareLabel} />
            <RowDivider />
            <DetailRow label="Specialties" value={specialtiesLabel} />
            <RowDivider />
            <DetailRow
              label="Resume"
              value={formatApplicationResumeStatus(application.resume_storage_path)}
            />
            {application.resume_storage_path ? (
              <ResumeViewButton
                storagePath={application.resume_storage_path}
                fileName={resumeFileName}
              />
            ) : null}
            {application.cover_message ? (
              <DetailSectionDivider>
                <DetailSection title="Cover message">
                  <DetailProse text={application.cover_message} />
                </DetailSection>
              </DetailSectionDivider>
            ) : null}
          </DetailSection>
        </View>

        {hasActions ? (
          <View style={styles.actionsSection}>
            <Text style={styles.actionsLabel}>Actions</Text>
            <View style={styles.actionsGrid}>
              {actionRows.map((row, rowIndex) =>
                row.primary || row.secondary ? (
                  <View key={`action-row-${rowIndex}`} style={styles.actionsRow}>
                    <View style={styles.actionCell}>
                      {row.primary ? (
                        <OnboardingButton
                          label={row.primary.label}
                          onPress={row.primary.onPress}
                          disabled={row.primary.disabled}
                        />
                      ) : null}
                    </View>
                    <View style={styles.actionCell}>
                      {row.secondary ? (
                        <OnboardingButton
                          label={row.secondary.label}
                          variant={row.secondary.variant}
                          onPress={row.secondary.onPress}
                        />
                      ) : null}
                    </View>
                  </View>
                ) : null,
              )}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
