import { Switch } from 'react-native';

import { useTheme } from '@/theme';

type ThemedSwitchProps = {
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  trackColorFalse?: string;
  accessibilityLabel?: string;
};

/** Native switch with consistent track/thumb colors. Web uses ThemedSwitch.web.tsx. */
export function ThemedSwitch({
  value,
  disabled,
  onValueChange,
  trackColorFalse,
  accessibilityLabel,
}: ThemedSwitchProps) {
  const { colors } = useTheme();
  const offTrack = trackColorFalse ?? colors.fillSubtle;

  return (
    <Switch
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: offTrack, true: colors.primary }}
      thumbColor={colors.primaryOnPrimary}
      ios_backgroundColor={offTrack}
    />
  );
}
