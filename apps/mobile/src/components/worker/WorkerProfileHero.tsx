import type { WorkerProfile } from '@chairside/api';
import { isWorkerProfileComplete } from '@chairside/api';
import { getProvinceLabel, getRoleTypeLabel } from '@chairside/config';
import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type WorkerProfileHeroProps = {
  displayName?: string | null;
  email?: string | null;
  profile: WorkerProfile | null;
};

function getInitials(name?: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function WorkerProfileHero({ displayName, email, profile }: WorkerProfileHeroProps) {
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
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    initials: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.primaryOnPrimary,
      letterSpacing: 0.5,
    },
    name: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 30,
      textAlign: 'center',
    },
    email: {
      ...typography.subtitle,
      fontSize: 14,
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
      backgroundColor: ready ? colors.primarySubtle : colors.fillSubtle,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: ready ? colors.primary : colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{getInitials(displayName)}</Text>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      {email?.trim() ? <Text style={styles.email}>{email.trim()}</Text> : null}
      <Text style={styles.meta}>{metaLine}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {ready ? 'Ready to quick apply' : 'Background incomplete'}
        </Text>
      </View>
    </View>
  );
}
