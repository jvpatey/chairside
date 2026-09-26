import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native';

import { adminDeleteAccount } from '@chairside/api';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebDialogShell } from '@/components/ui/WebDialogShell.web';
import {
  getAdminDeleteConfirmationPhrase,
  isAdminDeleteConfirmationMatch,
} from '@/lib/adminDeleteConfirmation';
import { radii } from '@/theme/tokens';
import { fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { webTypography } from '@/theme/web';

export type AdminDeleteTarget = {
  kind: 'clinic' | 'professional';
  id: string;
  name: string;
  email: string | null;
  /** Secondary line, e.g. account type or roles. */
  detail: string;
  /** Clinic plan; a non-free plan shows an app store subscription warning. */
  plan?: string;
};

type AdminDeleteAccountDialogProps = {
  target: AdminDeleteTarget | null;
  onClose: () => void;
  onDeleted: (target: AdminDeleteTarget) => void;
};

const CLINIC_CONSEQUENCES = [
  'Removes their login and signs them out everywhere',
  'Closes their live roles and fill-ins',
  'Removes their clinic profile, logo, and team access',
];

const PROFESSIONAL_CONSEQUENCES = [
  'Removes their login and signs them out everywhere',
  'Removes their profile, resume, and photo',
  'Withdraws their open applications',
];

export function AdminDeleteAccountDialog({
  target,
  onClose,
  onDeleted,
}: AdminDeleteAccountDialogProps) {
  const { colors } = useTheme();
  const [typed, setTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTyped('');
    setError(null);
    setIsDeleting(false);
  }, [target?.id]);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    header: { gap: spacing.sm },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.pill,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: `${colors.destructive}18`,
    },
    title: {
      ...webTypography.title,
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.35,
      color: colors.labelPrimary,
    },
    message: {
      fontFamily: fontRegular,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    accountCard: {
      gap: 2,
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
    },
    accountName: {
      fontFamily: fontSemibold,
      fontSize: 15,
      color: colors.labelPrimary,
    },
    accountLine: {
      fontFamily: fontRegular,
      fontSize: 13,
      color: colors.labelSecondary,
    },
    consequences: { gap: 6 },
    consequenceRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
    },
    consequenceText: {
      flex: 1,
      fontFamily: fontRegular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    warning: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: `${colors.warning}18`,
    },
    warningText: {
      flex: 1,
      fontFamily: fontRegular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelPrimary,
    },
    confirmLabel: {
      fontFamily: fontRegular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    confirmPhrase: {
      fontFamily: fontSemibold,
      color: colors.labelPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontFamily: fontRegular,
      fontSize: 14,
      color: colors.labelPrimary,
    } satisfies TextStyle,
    error: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.destructive,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    buttonDisabled: { opacity: 0.45 },
  }));

  if (!target) return null;

  const phrase = getAdminDeleteConfirmationPhrase(target.email);
  const matches = isAdminDeleteConfirmationMatch(typed, target.email);
  const isClinic = target.kind === 'clinic';
  const consequences = isClinic ? CLINIC_CONSEQUENCES : PROFESSIONAL_CONSEQUENCES;
  const hasPaidPlan = isClinic && Boolean(target.plan) && target.plan !== 'free';

  const handleClose = () => {
    if (isDeleting) return;
    onClose();
  };

  const handleDelete = async () => {
    if (!matches || isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      await adminDeleteAccount({ userId: target.id, confirmation: typed.trim() });
      onDeleted(target);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <WebDialogShell
      visible
      onClose={handleClose}
      maxWidth={480}
      backdropLabel="Cancel delete account">
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="trash-outline" size={22} color={colors.destructive} />
        </View>
        <Text style={styles.title}>
          {isClinic ? 'Delete clinic account?' : 'Delete professional account?'}
        </Text>
        <Text style={styles.message}>This can’t be undone.</Text>
      </View>

      <View style={styles.accountCard}>
        <Text style={styles.accountName} numberOfLines={2}>
          {target.name}
        </Text>
        <Text style={styles.accountLine} numberOfLines={1}>
          {target.email ?? 'No email on file'}
        </Text>
        {target.detail ? (
          <Text style={styles.accountLine} numberOfLines={2}>
            {target.detail}
          </Text>
        ) : null}
      </View>

      <View style={styles.consequences}>
        {consequences.map((line) => (
          <View key={line} style={styles.consequenceRow}>
            <Ionicons name="remove-circle-outline" size={16} color={colors.destructive} />
            <Text style={styles.consequenceText}>{line}</Text>
          </View>
        ))}
      </View>

      {hasPaidPlan ? (
        <View style={styles.warning}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={styles.warningText}>
            This clinic is on a paid plan. Deleting the account won’t cancel an App Store or Google
            Play subscription.
          </Text>
        </View>
      ) : null}

      <Text style={styles.confirmLabel}>
        Type <Text style={styles.confirmPhrase}>{phrase}</Text> to confirm.
      </Text>
      <TextInput
        value={typed}
        onChangeText={(text) => {
          setTyped(text);
          if (error) setError(null);
        }}
        placeholder={phrase}
        placeholderTextColor={colors.labelTertiary}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        editable={!isDeleting}
        onSubmitEditing={() => void handleDelete()}
        accessibilityLabel={`Type ${phrase} to confirm`}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <OnboardingButton
          label="Cancel"
          variant="secondary"
          split
          disabled={isDeleting}
          onPress={handleClose}
        />
        <OnboardingButton
          label={isDeleting ? 'Deleting…' : 'Delete account'}
          variant="destructive"
          split
          disabled={!matches || isDeleting}
          style={!matches || isDeleting ? styles.buttonDisabled : undefined}
          onPress={() => void handleDelete()}
        />
      </View>
    </WebDialogShell>
  );
}
