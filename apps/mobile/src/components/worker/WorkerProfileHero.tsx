import type { WorkerProfile } from '@chairside/api';
import { isWorkerProfileComplete } from '@chairside/api';
import { getProvinceLabel, getRoleTypeLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { useTheme, useThemedStyles } from '@/theme';

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
  const { colors } = useTheme();
  const { photoUri, isUploading, pickPhoto } = useProfilePhoto();
  const name = displayName?.trim() || 'Your profile';
  const ready = isWorkerProfileComplete(profile);
  const roleLabel = profile?.role_type ? getRoleTypeLabel(profile.role_type) : null;
  const location = [profile?.city, profile?.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');

  const metaLine =
    roleLabel && location
      ? `${roleLabel} · ${location}`
      : roleLabel ?? location ?? 'Add your background to get started';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
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
    badge: {
      marginTop: spacing.sm,
      borderRadius: 999,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      backgroundColor: colors.primarySubtle,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
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
      <View style={styles.avatarWrap}>
        {editable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            disabled={isUploading}
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
      {ready ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Ready to apply</Text>
        </View>
      ) : null}
    </View>
  );
}
