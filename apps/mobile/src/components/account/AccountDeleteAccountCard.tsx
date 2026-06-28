import { Text } from 'react-native';

import { AccountSettingsCard } from '@/components/account/AccountSettingsCard';
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

  const styles = useThemedStyles(({ typography }) => ({
    body: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  return (
    <AccountSettingsCard title="Delete account" icon="trash-outline" variant="danger">
      <Text style={styles.body}>{description}</Text>
      <OnboardingButton
        label={isDeleting ? 'Deleting account…' : 'Delete account'}
        variant="destructive"
        disabled={busy}
        onPress={onDeleteAccount}
      />
    </AccountSettingsCard>
  );
}
