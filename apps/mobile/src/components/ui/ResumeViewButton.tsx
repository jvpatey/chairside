import { useState } from 'react';
import { Alert } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { openResumePreview } from '@/lib/openResumePreview';

type ResumeViewButtonProps = {
  storagePath: string;
  fileName: string;
  label?: string;
  disabled?: boolean;
};

/** Opens the resume in the system preview (Quick Look on iOS) without the save/share sheet. */
export function ResumeViewButton({
  storagePath,
  fileName,
  label = 'View resume',
  disabled = false,
}: ResumeViewButtonProps) {
  const [isOpening, setIsOpening] = useState(false);

  const handlePress = async () => {
    setIsOpening(true);
    try {
      await openResumePreview(storagePath, fileName);
    } catch (error) {
      Alert.alert(
        'Could not open resume',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <OnboardingButton
      label={isOpening ? 'Opening…' : label}
      variant="secondary"
      onPress={() => void handlePress()}
      disabled={disabled || isOpening}
    />
  );
}
