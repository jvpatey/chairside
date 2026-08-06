import type { ClinicBillingState } from '@chairside/api';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { ClinicPlanBadge } from '@/components/clinic/ClinicPlanBadge';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import {
  formatClinicSubscriptionStatus,
  formatSubscriptionStatusBadge,
} from '@/lib/clinicPlanPresentation';
import { fontSemibold, useThemedStyles } from '@/theme';

export type AccountMenuSheetHeaderProps = {
  role: 'worker' | 'clinic';
  displayName: string;
  subtitle?: string | null;
  meta?: string | null;
  email?: string | null;
  avatarKind: 'worker' | 'clinic';
  photoUri?: string | null;
  isGroup?: boolean;
  billing?: ClinicBillingState | null;
  locationCount?: number;
};

function getAccountTypeLabel(role: 'worker' | 'clinic', isGroup: boolean): string {
  if (role === 'worker') return 'Dental professional';
  return isGroup ? 'Dental group' : 'Individual clinic';
}

function formatLocationCount(count: number): string {
  return count === 1 ? '1 location' : `${count} locations`;
}

type InfoRowProps = {
  label: string;
  value: string;
  valueNode?: ReactNode;
};

function InfoRow({ label, value, valueNode }: InfoRowProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      minHeight: 28,
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      flexShrink: 0,
    },
    value: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
      textAlign: 'right',
      flexShrink: 1,
    },
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {valueNode ?? (
        <Text style={styles.value} numberOfLines={2}>
          {value}
        </Text>
      )}
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
  billing,
  locationCount,
}: AccountMenuSheetHeaderProps) {
  const trimmedEmail = email?.trim() || null;
  const trimmedMeta = meta?.trim() || null;
  const trimmedSubtitle = subtitle?.trim() || null;
  const plan = billing?.plan;
  const subscriptionNote =
    billing && plan && plan !== 'free'
      ? formatClinicSubscriptionStatus(billing.status, billing.currentPeriodEnd)
      : null;
  const statusBadge =
    billing && plan && plan !== 'free' ? formatSubscriptionStatusBadge(billing.status) : null;

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
      gap: 2,
    },
    name: {
      fontSize: 17,
      lineHeight: 22,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    meta: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    infoBlock: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    statusLine: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelTertiary,
      textAlign: 'right',
      marginTop: -2,
    },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.identityRow}>
        {avatarKind === 'worker' ? (
          <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={48} />
        ) : (
          <ClinicLogoAvatar clinicName={displayName} logoUri={photoUri} size={48} />
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

      <View style={styles.infoBlock}>
        <InfoRow label="Account type" value={getAccountTypeLabel(role, isGroup)} />
        {role === 'clinic' && plan ? (
          <InfoRow
            label="Plan"
            value=""
            valueNode={
              <View style={{ alignItems: 'flex-end', gap: 2, flexShrink: 1 }}>
                <ClinicPlanBadge plan={plan} />
                {statusBadge && statusBadge.label !== 'Active' ? (
                  <Text style={styles.statusLine}>{statusBadge.label}</Text>
                ) : null}
                {subscriptionNote ? (
                  <Text style={styles.statusLine} numberOfLines={2}>
                    {subscriptionNote}
                  </Text>
                ) : null}
              </View>
            }
          />
        ) : null}
        {role === 'clinic' && isGroup && locationCount != null && locationCount > 0 ? (
          <InfoRow label="Locations" value={formatLocationCount(locationCount)} />
        ) : null}
        {trimmedEmail ? <InfoRow label="Email" value={trimmedEmail} /> : null}
      </View>
    </View>
  );
}
