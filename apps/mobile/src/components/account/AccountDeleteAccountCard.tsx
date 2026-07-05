import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useThemedStyles } from '@/theme';

type AccountDeleteAccountCardProps = {
  isDeleting: boolean;
  disabled?: boolean;
  description: string;
  onDeleteAccount: () => void;
};

export function AccountDeleteAccountCard({
  isDeleting,
  disabled = false,
  description,
  onDeleteAccount,
}: AccountDeleteAccountCardProps) {
  const busy = disabled || isDeleting;

  const styles = useThemedStyles(({ spacing, typography }) => ({
    body: {
      gap: spacing.md,
    },
    description: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  return (
    <View style={styles.body}>
      <Text style={styles.description}>{description}</Text>
      <OnboardingButton
        label={isDeleting ? 'Deleting account…' : 'Delete account'}
        variant="destructive"
        disabled={busy}
        onPress={onDeleteAccount}
      />
    </View>
  );
}
