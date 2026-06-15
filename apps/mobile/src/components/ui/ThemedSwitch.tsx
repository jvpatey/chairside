import { Switch } from 'react-native';

import { useTheme } from '@/theme';

type ThemedSwitchProps = {
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  trackColorFalse?: string;
  trackColorTrue?: string;
  accessibilityLabel?: string;
};

/** Native switch with consistent track/thumb colors. Web uses ThemedSwitch.web.tsx. */
export function ThemedSwitch({
  value,
  disabled,
  onValueChange,
  trackColorFalse,
  trackColorTrue,
  accessibilityLabel,
}: ThemedSwitchProps) {
  const { colors } = useTheme();
  const offTrack = trackColorFalse ?? colors.fillSubtle;
  const onTrack = trackColorTrue ?? colors.primary;

  return (
    <Switch
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: offTrack, true: onTrack }}
      thumbColor={colors.primaryOnPrimary}
      ios_backgroundColor={offTrack}
    />
  );
}
