import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type CardExpandToggleProps = {
  expanded: boolean;
  onPress: () => void;
};

export function CardExpandToggle({ expanded, onPress }: CardExpandToggleProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ spacing }) => ({
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    toggleText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <Pressable
      style={styles.toggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}>
      <Text style={styles.toggleText}>{expanded ? 'Hide details' : 'View details'}</Text>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={colors.primary}
      />
    </Pressable>
  );
}
