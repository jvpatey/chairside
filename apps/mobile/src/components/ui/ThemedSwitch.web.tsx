import { Pressable, View, type GestureResponderEvent } from 'react-native';

import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const THUMB_INSET = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;

type ThemedSwitchProps = {
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  trackColorFalse?: string;
  accessibilityLabel?: string;
};

/** Polished iOS-style switch for web — avoids RN Switch blue/green rendering. */
export function ThemedSwitch({
  value,
  disabled,
  onValueChange,
  trackColorFalse,
  accessibilityLabel,
}: ThemedSwitchProps) {
  const { colors } = useTheme();
  const offTrack = trackColorFalse ?? colors.fillSubtle;

  const styles = useThemedStyles(({ colors }) => ({
    track: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      borderWidth: 1,
      borderColor: colors.separator,
      justifyContent: 'center',
      padding: THUMB_INSET,
      ...webPointer(disabled ? 'default' : 'pointer'),
      ...webOnlyStyle({
        transitionProperty: 'background-color, border-color',
        transitionDuration: '160ms',
      } as const),
    },
    trackOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    trackDisabled: {
      opacity: 0.45,
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: colors.primaryOnPrimary,
      ...webOnlyStyle({
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.28)',
        transitionProperty: 'transform',
        transitionDuration: '160ms',
      } as const),
    },
  }));

  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation?.();
    if (disabled) return;
    onValueChange(!value);
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={handlePress}
      style={[
        styles.track,
        { backgroundColor: value ? colors.primary : offTrack },
        value && styles.trackOn,
        disabled && styles.trackDisabled,
      ]}>
      <View
        style={[
          styles.thumb,
          webOnlyStyle({
            transform: [{ translateX: value ? THUMB_TRAVEL : 0 }],
          }),
        ]}
      />
    </Pressable>
  );
}
