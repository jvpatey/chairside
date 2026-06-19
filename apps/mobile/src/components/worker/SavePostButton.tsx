import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';
import { webPointer } from '@/lib/webPressableStyles';

type SavePostButtonProps = {
  isSaved: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: number;
  accessibilityLabel?: string;
};

export function SavePostButton({
  isSaved,
  onToggle,
  disabled = false,
  size = 22,
  accessibilityLabel,
}: SavePostButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing }) => ({
    button: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      margin: -spacing.xs,
      ...webPointer(),
    },
    buttonPressed: {
      opacity: 0.65,
    },
  }));

  const label =
    accessibilityLabel ??
    (isSaved ? 'Remove from saved' : 'Save for later');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSaved, disabled }}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
    >
      <Ionicons
        name={isSaved ? 'bookmark' : 'bookmark-outline'}
        size={size}
        color={isSaved ? colors.primary : colors.labelSecondary}
      />
    </Pressable>
  );
}
