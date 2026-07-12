import { View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useThemedStyles } from '@/theme';

type SetupStepFooterProps = {
  canContinue: boolean;
  validationMessage: string | null;
  showValidation?: boolean;
  submitError: string | null;
  isSubmitting: boolean;
  continueLabel: string;
  onContinue: () => void;
};

export function SetupStepFooter({
  canContinue,
  validationMessage,
  showValidation = false,
  submitError,
  isSubmitting,
  continueLabel,
  onContinue,
}: SetupStepFooterProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    footer: { gap: spacing.md, marginTop: spacing.lg },
  }));

  const bannerMessage =
    submitError ?? (showValidation && !canContinue ? validationMessage : null);

  return (
    <View style={styles.footer}>
      {bannerMessage ? <FormErrorBanner message={bannerMessage} /> : null}
      <OnboardingButton
        label={isSubmitting ? 'Saving…' : continueLabel}
        disabled={isSubmitting}
        onPress={onContinue}
      />
    </View>
  );
}
