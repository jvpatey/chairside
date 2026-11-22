import type { WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import { formatRoleTypesLabel, getProvinceLabel } from '@chairside/config';
import type { User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountChangePasswordSection } from '@/components/account/AccountChangePasswordSection';
import { AccountDeleteAccountCard } from '@/components/account/AccountDeleteAccountCard';
import { AccountDisplayNameField } from '@/components/account/AccountDisplayNameField';
import { AccountLegalLinks } from '@/components/account/AccountLegalLinks';
import { AccountSignOutCard } from '@/components/account/AccountSignOutCard';
import { getSetupEditRoute } from '@/hooks/useSetupEditMode';
import { userHasEmailPasswordLogin } from '@/lib/authProviders';
import { formatPhoneNumber } from '@/lib/phone';
import { WORKER_AUTH_LEGAL_PATHS } from '@/lib/routing';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type WorkerYouProfileViewProps = {
  user: User;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  workerProfile: WorkerProfile | null;
  onProfileRefresh: () => Promise<unknown>;
  isSigningOut: boolean;
  onSignOut: () => void;
  isDeleting: boolean;
  onDeleteAccount: () => void;
  deleteDescription: string;
};

function FactRow({
  label,
  value,
  onEdit,
  editLabel = 'Edit',
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  editLabel?: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      gap: 4,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    top: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
    },
    value: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    edit: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.primary,
      ...webPointer(),
    },
  }));

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>
        {onEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${editLabel} ${label}`}
            onPress={onEdit}
            style={({ pressed, hovered }) => [
              webHover(hovered, pressed, { opacity: 0.85 }),
              pressed && { opacity: 0.75 },
            ]}>
            <Text style={styles.edit}>{editLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );
}

/** Single-document profile: matching essentials + account controls, no card stack. */
export function WorkerYouProfileView({
  user,
  displayName,
  firstName,
  lastName,
  workerProfile,
  onProfileRefresh,
  isSigningOut,
  onSignOut,
  isDeleting,
  onDeleteAccount,
  deleteDescription,
}: WorkerYouProfileViewProps) {
  const busy = isSigningOut || isDeleting;
  const showPassword = userHasEmailPasswordLogin(user);
  const roles = formatRoleTypesLabel(getWorkerRoleTypes(workerProfile)) || '';
  const place = [
    workerProfile?.city,
    workerProfile?.province ? getProvinceLabel(workerProfile.province) : null,
  ]
    .filter(Boolean)
    .join(', ');
  const phone = workerProfile?.phone?.trim()
    ? formatPhoneNumber(workerProfile.phone)
    : '';

  const styles = useThemedStyles(({ colors, spacing }) => ({
    root: {
      gap: spacing.xl,
      width: '100%' as const,
    },
    doc: {
      gap: 0,
    },
    sectionLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
      marginBottom: spacing.sm,
    },
    quiet: {
      gap: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    quietHint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.doc}>
        <Text style={styles.sectionLabel}>You</Text>
        <AccountDisplayNameField
          userId={user.id}
          savedFirstName={firstName}
          savedLastName={lastName}
          savedDisplayName={displayName}
          audience="worker"
          onSaved={onProfileRefresh}
        />
        <FactRow label="Email" value={user.email?.trim() || ''} />
        <FactRow
          label="Mobile"
          value={phone}
          onEdit={() =>
            router.push(getSetupEditRoute('/(worker-setup)/basics', 'worker-account'))
          }
        />
        <FactRow
          label="Role"
          value={roles}
          onEdit={() =>
            router.push(getSetupEditRoute('/(worker-setup)/basics', 'worker-account'))
          }
        />
        <FactRow
          label="City"
          value={place}
          onEdit={() =>
            router.push(getSetupEditRoute('/(worker-setup)/location', 'worker-account'))
          }
        />
      </View>

      {showPassword ? (
        <View style={styles.quiet}>
          <Text style={styles.sectionLabel}>Password</Text>
          <AccountChangePasswordSection user={user} showSectionLabel={false} />
        </View>
      ) : null}

      <View style={styles.quiet}>
        <Text style={styles.sectionLabel}>Legal & support</Text>
        <AccountLegalLinks legalPaths={WORKER_AUTH_LEGAL_PATHS} />
      </View>

      <View style={styles.quiet}>
        <Text style={styles.quietHint}>Sign out on this device anytime.</Text>
        <AccountSignOutCard
          isSigningOut={isSigningOut}
          disabled={busy}
          onSignOut={onSignOut}
        />
        <AccountDeleteAccountCard
          isDeleting={isDeleting}
          disabled={busy}
          description={deleteDescription}
          onDeleteAccount={onDeleteAccount}
        />
      </View>
    </View>
  );
}
