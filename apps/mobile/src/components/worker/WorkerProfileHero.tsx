import type { WorkerProfile } from '@chairside/api';
import { getProvinceLabel, formatRoleTypesLabel } from '@chairside/config';
import { getWorkerRoleTypes } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { AccountTypeBadge } from '@/components/account/AccountTypeBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { getAccountTypeLabel } from '@/lib/profileHubSubtitles';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { fontBold, useTheme, useThemedStyles } from '@/theme';

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

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    band: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
      padding: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    avatarPressable: {
      borderRadius: 999,
      ...webPointer(),
    },
    avatarPressableHovered: {
      opacity: 0.92,
    },
    avatarWrap: {
      position: 'relative' as const,
      flexShrink: 0,
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
    identity: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    name: {
      fontSize: 26,
      lineHeight: 32,
      fontFamily: fontBold,
      fontWeight: '700',
      letterSpacing: -0.4,
      color: colors.labelPrimary,
    },
    meta: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    badgeRow: {
      marginTop: spacing.xs,
    },
  }));

  const avatar = (
    <WorkerProfileAvatar
      displayName={displayName}
      photoUri={photoUri}
      size={64}
      isLoading={isUploading}
    />
  );

  return (
    <View style={styles.band}>
      <View style={styles.row}>
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
        <View style={styles.identity}>
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
    </View>
  );
}
