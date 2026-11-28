import { Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useThemedStyles } from '@/theme';
import { webTypography } from '@/theme/web';

export type AccountMenuSheetHeaderProps = {
  role: 'worker' | 'clinic';
  displayName: string;
  subtitle?: string | null;
  meta?: string | null;
  email?: string | null;
  avatarKind: 'worker' | 'clinic';
  photoUri?: string | null;
  isGroup?: boolean;
  locationCount?: number;
};

function formatLocationCount(count: number): string {
  return count === 1 ? '1 location' : `${count} locations`;
}

/** Compact account summary above the account menu: identity only, no detail table. */
export function AccountMenuSheetHeader({
  role,
  displayName,
  subtitle,
  meta,
  email,
  avatarKind,
  photoUri,
  isGroup = false,
  locationCount,
}: AccountMenuSheetHeaderProps) {
  const trimmedEmail = email?.trim() || null;
  const trimmedMeta = meta?.trim() || null;
  const trimmedSubtitle = subtitle?.trim() || null;

  // Groups fold the location count into the subtitle line ("Dental group · 2 locations").
  const locationText =
    role === 'clinic' && isGroup && locationCount != null && locationCount > 0
      ? formatLocationCount(locationCount)
      : null;
  const detailLine = [trimmedSubtitle, locationText].filter(Boolean).join(' · ') || null;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    identityRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    name: {
      ...webTypography.title,
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: -0.3,
      color: colors.labelPrimary,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    meta: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
      letterSpacing: 0.2,
    },
    email: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
  }));

  return (
    <View style={styles.identityRow}>
      {avatarKind === 'worker' ? (
        <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={56} />
      ) : (
        <ClinicLogoAvatar clinicName={displayName} logoUri={photoUri} size={56} />
      )}
      <View style={styles.textBlock}>
        <Text style={styles.name} numberOfLines={2}>
          {displayName}
        </Text>
        {detailLine ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {detailLine}
          </Text>
        ) : null}
        {trimmedMeta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {trimmedMeta}
          </Text>
        ) : null}
        {trimmedEmail ? (
          <Text style={styles.email} numberOfLines={1}>
            {trimmedEmail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
