import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { Pressable } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type ProfileHeaderButtonProps = {
  href: Href;
  /** `hero` — top-left inside dashboard hero card; `header` — screen title row */
  placement?: 'header' | 'hero';
};

export function ProfileHeaderButton({ href, placement = 'header' }: ProfileHeaderButtonProps) {
  const { colors } = useTheme();
  const inHero = placement === 'hero';

  const styles = useThemedStyles(({ colors, spacing }) => ({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: inHero ? 0 : spacing.sm,
      backgroundColor: colors.fillSubtle,
    },
    buttonPressed: {
      backgroundColor: colors.separator,
      opacity: 0.9,
    },
  }));

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      accessibilityRole="button"
      accessibilityLabel="Profile"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(href);
      }}>
      <Ionicons name="person-outline" size={22} color={colors.labelPrimary} />
    </Pressable>
  );
}
