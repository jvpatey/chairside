import { AccountSettingsCard } from '@/components/account/AccountSettingsCard';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';

type AccountSignOutCardProps = {
  isSigningOut: boolean;
  disabled?: boolean;
  onSignOut: () => void;
};

export function AccountSignOutCard({
  isSigningOut,
  disabled = false,
  onSignOut,
}: AccountSignOutCardProps) {
  const busy = disabled || isSigningOut;

  return (
    <AccountSettingsCard title="Sign out" icon="log-out-outline">
      <OnboardingButton
        label={isSigningOut ? 'Signing out…' : 'Sign out on this device'}
        variant="ghost"
        disabled={busy}
        onPress={onSignOut}
      />
    </AccountSettingsCard>
  );
}
