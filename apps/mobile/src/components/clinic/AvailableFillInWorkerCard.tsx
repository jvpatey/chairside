import type { FillInOutreachWorker } from '@chairside/api';
import { getRoleTypeLabel } from '@chairside/config';
import { Text, View } from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useThemedStyles, type GradientAccent } from '@/theme';

type AvailableFillInWorkerCardProps = {
  worker: FillInOutreachWorker;
  onMessage: () => void;
  accent?: GradientAccent;
};

function formatRoleLabels(roleTypes: string[]): string {
  if (roleTypes.length === 0) return 'Candidate';
  if (roleTypes.length === 1) return getRoleTypeLabel(roleTypes[0]!);
  return roleTypes.map((role) => getRoleTypeLabel(role)).join(', ');
}

function formatScheduleLines(summary: string | null | undefined): string[] {
  if (!summary?.trim()) return [];
  return summary
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function AvailableFillInWorkerCard({
  worker,
  onMessage,
  accent = 'secondary',
}: AvailableFillInWorkerCardProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.md,
    },
    availabilityBlock: {
      gap: spacing.xs,
    },
    availabilityLabel: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    availabilityLine: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    smsBadge: {
      alignSelf: 'flex-start',
      fontSize: 12,
      fontWeight: '600',
      color: colors.secondary,
      backgroundColor: colors.secondarySubtle,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: 'hidden',
    },
  }));

  const roleLabel = formatRoleLabels(worker.roleTypes);
  const location = [roleLabel, worker.city].filter(Boolean).join(' · ');
  const experience =
    worker.yearsOfExperience != null ? `${worker.yearsOfExperience} yrs experience` : null;
  const scheduleLines = formatScheduleLines(worker.availabilitySummary);

  return (
    <View style={styles.card}>
      <ApplicantPostHeader
        displayName={worker.displayName}
        photoStoragePath={worker.photoStoragePath}
        eyebrow=""
        title={worker.displayName}
        location={location || null}
        detail={experience}
        avatarAlign="center"
      />

      {scheduleLines.length > 0 ? (
        <View style={styles.availabilityBlock}>
          <Text style={styles.availabilityLabel}>Available on:</Text>
          {scheduleLines.map((line) => (
            <Text key={line} style={styles.availabilityLine}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      {worker.smsOptIn ? <Text style={styles.smsBadge}>Text alerts on</Text> : null}

      <OnboardingButton
        label={worker.existingConversationId ? 'Continue conversation' : 'Message'}
        accent={accent}
        onPress={onMessage}
      />
    </View>
  );
}
