import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { Image, Platform, Pressable } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ProfileHeaderButtonProps = {
  href: Href;
  /** `hero` — top-left inside dashboard hero card; `header` — screen title row */
  placement?: 'header' | 'hero';
  avatarKind?: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
  size?: number;
};

export function ProfileHeaderButton({
  href,
  placement = 'header',
  avatarKind,
  displayName,
  photoUri,
  size = 40,
}: ProfileHeaderButtonProps) {
  const { colors } = useTheme();
  const inHero = placement === 'hero';
  const showAvatar = Boolean(avatarKind && (photoUri || displayName));

  const styles = useThemedStyles(({ colors, spacing }) => ({
    button: {
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: inHero ? 0 : spacing.sm,
      backgroundColor: colors.fillSubtle,
      overflow: 'hidden',
      ...webPointer(),
    },
    buttonHovered: {
      backgroundColor: colors.separator,
    },
    buttonPressed: {
      backgroundColor: colors.separator,
      opacity: 0.9,
    },
    image: {
      width: size,
      height: size,
    },
  }));

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.button,
        isWeb && hovered && !pressed && styles.buttonHovered,
        pressed && styles.buttonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Profile"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(href);
      }}>
      {showAvatar && avatarKind === 'worker' ? (
        <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={size} />
      ) : showAvatar && avatarKind === 'clinic' ? (
        <ClinicLogoAvatar clinicName={displayName} logoUri={photoUri} size={size} />
      ) : photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.image} accessibilityLabel="Profile" />
      ) : (
        <Ionicons name="person-outline" size={Math.round(size * 0.55)} color={colors.labelPrimary} />
      )}
    </Pressable>
  );
}
