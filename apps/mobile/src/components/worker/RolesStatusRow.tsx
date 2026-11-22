import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_PROFILE_APPLICATION_KIT } from '@/lib/routing';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

/** Compact hub chrome — only when setup is incomplete. Clinic messaging stays off Roles. */
export function RolesStatusRow() {
  const { colors } = useTheme();
  const { workerProfile } = useWorkerProfile();
  const profileComplete = Boolean(workerProfile?.setup_completed_at);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.fillSubtle,
      borderWidth: 0.5,
      borderColor: colors.separator,
      ...webPointer(),
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.fillSubtle,
      flexShrink: 0,
    },
    label: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }));

  if (profileComplete) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Finish profile to apply. Open application kit"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(WORKER_PROFILE_APPLICATION_KIT);
      }}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, webListRowHoverStyles(colors)),
        pressed && { opacity: 0.88 },
      ]}>
      <View style={styles.iconWrap}>
        <Ionicons name="document-text-outline" size={15} color={colors.labelSecondary} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        Finish profile to apply
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
    </Pressable>
  );
}
