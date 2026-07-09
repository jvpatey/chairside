import type { WorkerProfile } from '@chairside/api';
import { getProvinceLabel, formatRoleTypesLabel } from '@chairside/config';
import { getWorkerRoleTypes } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { AccountTypeBadge } from '@/components/account/AccountTypeBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { getAccountTypeLabel } from '@/lib/profileHubSubtitles';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { getHeroBandGradient, useTheme, useThemedStyles } from '@/theme';

type WorkerProfileHeroProps = {
  displayName?: string | null;
  profile: WorkerProfile | null;
  editable?: boolean;
};

export function WorkerProfileHero({
  displayName,
  profile,
  editable = false,
}: WorkerProfileHeroProps) {
  const { colors, isDark } = useTheme();
  const { photoUri, isUploading, pickPhoto } = useProfilePhoto();
  const name = displayName?.trim() || 'Your profile';
  const roleLabel = profile
    ? formatRoleTypesLabel(getWorkerRoleTypes(profile)) || null
    : null;
  const location = [profile?.city, profile?.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');

  const metaLine =
    roleLabel && location
      ? `${roleLabel} · ${location}`
      : roleLabel ?? location ?? 'Add your background to get started';

  const heroGradient = getHeroBandGradient(colors, isDark, 'primary');

  const styles = useThemedStyles(({ colors, spacing, typography, radii, elevation, isDark }) => ({
    card: {
      borderRadius: radii.hero,
      overflow: 'hidden',
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.separator,
      position: 'relative',
      ...elevation('subtle'),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    avatarPressable: {
      borderRadius: 999,
      ...webPointer(),
    },
    avatarPressableHovered: {
      opacity: 0.92,
    },
    avatarWrap: {
      marginBottom: spacing.xs,
      position: 'relative' as const,
    },
    editBadge: {
      position: 'absolute' as const,
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    editBadgeHovered: {
      opacity: 0.9,
    },
    name: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 30,
      textAlign: 'center',
    },
    meta: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    badgeRow: {
      justifyContent: 'center',
      marginTop: spacing.xs,
      width: '100%' as const,
    },
  }));

  const avatar = (
    <WorkerProfileAvatar
      displayName={displayName}
      photoUri={photoUri}
      size={72}
      isLoading={isUploading}
    />
  );

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={heroGradient}
        locations={[0, 0.35, 0.65, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          {editable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              disabled={isUploading}
              style={({ pressed, hovered }) => [
                styles.avatarPressable,
                webHover(hovered, pressed, styles.avatarPressableHovered, isUploading),
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => void pickPhoto()}>
              {avatar}
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={14} color={colors.primaryOnPrimary} />
              </View>
            </Pressable>
          ) : (
            avatar
          )}
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.meta}>{metaLine}</Text>
        <View style={styles.badgeRow}>
          <BadgeRow>
            <AccountTypeBadge label={getAccountTypeLabel('worker')} inRow />
          </BadgeRow>
        </View>
      </View>
    </View>
  );
}
