import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { Image, Pressable } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useTheme, useThemedStyles } from '@/theme';

type ProfileHeaderButtonProps = {
  href: Href;
  /** `hero` — top-left inside dashboard hero card; `header` — screen title row */
  placement?: 'header' | 'hero';
  avatarKind?: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
};

export function ProfileHeaderButton({
  href,
  placement = 'header',
  avatarKind,
  displayName,
  photoUri,
}: ProfileHeaderButtonProps) {
  const { colors } = useTheme();
  const inHero = placement === 'hero';
  const showAvatar = Boolean(avatarKind && (photoUri || displayName));

  const styles = useThemedStyles(({ colors, spacing }) => ({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: inHero ? 0 : spacing.sm,
      backgroundColor: colors.fillSubtle,
      overflow: 'hidden',
    },
    buttonPressed: {
      backgroundColor: colors.separator,
      opacity: 0.9,
    },
    image: {
      width: 40,
      height: 40,
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
      {showAvatar && avatarKind === 'worker' ? (
        <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={40} />
      ) : showAvatar && avatarKind === 'clinic' ? (
        <ClinicLogoAvatar clinicName={displayName} logoUri={photoUri} size={40} />
      ) : photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.image} accessibilityLabel="Profile" />
      ) : (
        <Ionicons name="person-outline" size={22} color={colors.labelPrimary} />
      )}
    </Pressable>
  );
}
