import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { getAccountTypeLabel } from '@/lib/profileHubSubtitles';
import { fontSemibold, useThemedStyles } from '@/theme';
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

type InfoTableRowProps = {
  label: string;
  value: string;
  valueNode?: ReactNode;
  isLast?: boolean;
};

function InfoTableRow({ label, value, valueNode, isLast = false }: InfoTableRowProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      minHeight: 44,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.separator,
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      flexShrink: 0,
    },
    valueCell: {
      flex: 1,
      alignItems: 'flex-end',
      minWidth: 0,
    },
    value: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
      textAlign: 'right',
    },
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueCell}>
        {valueNode ?? (
          <Text style={styles.value} numberOfLines={2}>
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}

/** Rich account summary for the sidebar account menu. */
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

  const detailRows: InfoTableRowProps[] = [];

  // Clinics keep account type / locations; workers skip "Account type" (role is already clear).
  if (role === 'clinic') {
    detailRows.push({ label: 'Account type', value: getAccountTypeLabel(role, { isGroup }) });
    if (isGroup && locationCount != null && locationCount > 0) {
      detailRows.push({
        label: 'Locations',
        value: formatLocationCount(locationCount),
      });
    }
  }

  if (trimmedEmail) {
    detailRows.push({ label: 'Email', value: trimmedEmail });
  }

  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      gap: spacing.md,
    },
    identityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 3,
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
      fontWeight: '600',
      color: colors.labelTertiary,
      letterSpacing: 0.2,
    },
    detailsSection: {
      gap: spacing.sm,
    },
    sectionEyebrow: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
      paddingHorizontal: spacing.xs,
    },
  }));

  return (
    <View style={styles.wrap}>
      <SurfaceCard padding="lg" gap elevationLevel="subtle">
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
            {trimmedSubtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {trimmedSubtitle}
              </Text>
            ) : null}
            {trimmedMeta ? (
              <Text style={styles.meta} numberOfLines={1}>
                {trimmedMeta}
              </Text>
            ) : null}
          </View>
        </View>
      </SurfaceCard>

      {detailRows.length > 0 ? (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionEyebrow}>Account details</Text>
          <SurfaceCard padding="none" elevationLevel="subtle">
            {detailRows.map((row, index) => (
              <InfoTableRow
                key={row.label}
                {...row}
                isLast={index === detailRows.length - 1}
              />
            ))}
          </SurfaceCard>
        </View>
      ) : null}
    </View>
  );
}
