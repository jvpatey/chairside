import type { OpenInquiryWorker } from '@chairside/api';
import { getRoleTypeLabel } from '@chairside/config';
import { Text, View } from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useThemedStyles, type GradientAccent } from '@/theme';

type OpenInquiryCandidateCardProps = {
  worker: OpenInquiryWorker;
  onMessage: () => void;
  accent?: GradientAccent;
};

function formatRoleLabels(roleTypes: string[]): string {
  if (roleTypes.length === 0) return 'Candidate';
  if (roleTypes.length === 1) return getRoleTypeLabel(roleTypes[0]!);
  return roleTypes.map((role) => getRoleTypeLabel(role)).join(', ');
}

export function OpenInquiryCandidateCard({
  worker,
  onMessage,
  accent = 'primary',
}: OpenInquiryCandidateCardProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.md,
    },
    bio: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  const roleLabel = formatRoleLabels(worker.roleTypes);
  const location = [roleLabel, worker.city].filter(Boolean).join(' · ');
  const experience =
    worker.yearsOfExperience != null ? `${worker.yearsOfExperience} yrs experience` : null;
  const bio = worker.bio?.trim() || null;

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
      {bio ? (
        <Text style={styles.bio} numberOfLines={3}>
          {bio}
        </Text>
      ) : null}
      <OnboardingButton
        label={worker.existingConversationId ? 'Continue conversation' : 'Message'}
        accent={accent}
        onPress={onMessage}
      />
    </View>
  );
}
