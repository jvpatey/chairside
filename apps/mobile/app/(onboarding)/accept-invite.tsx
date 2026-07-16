import {
  acceptClinicManagerInvitation,
  isClinicGroupsEnabled,
  previewClinicManagerInvitation,
  signOut,
  type ClinicInvitationPreview,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import {
  clearClinicInviteToken,
  saveClinicInviteToken,
} from '@/lib/clinicInviteSession';
import { CLINIC_HOME, CLINIC_SETUP_ACCOUNT_TYPE } from '@/lib/routing';
import {
  colorWithAlpha,
  getHeroBandGradient,
  useTheme,
  useThemedStyles,
} from '@/theme';

function formatExpiry(iso?: string): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('en-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return null;
  }
}

function InviteDetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing, typography, colors: themeColors }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm + 2,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colorWithAlpha(themeColors.primary, 0.12),
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
      paddingTop: 2,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      color: themeColors.labelTertiary,
      letterSpacing: 0.2,
    },
    value: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 21,
      color: themeColors.labelPrimary,
    },
  }));

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

function ClinicInvitePreviewCard({
  preview,
  inviteTitle,
  inviterLabel,
}: {
  preview: ClinicInvitationPreview;
  inviteTitle: string;
  inviterLabel: string;
}) {
  const { colors, isDark } = useTheme();
  const heroGradient = getHeroBandGradient(colors, isDark, 'primary');
  const locationNames = preview.location_names ?? [];
  const expiresLabel = formatExpiry(preview.expires_at);

  const styles = useThemedStyles(({ colors: themeColors, spacing, radii, typography, elevation }) => ({
    card: {
      borderRadius: radii.hero,
      overflow: 'hidden' as const,
      borderWidth: 0,
      backgroundColor: themeColors.surface,
      ...elevation('subtle'),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    header: {
      gap: spacing.sm,
    },
    eyebrow: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: themeColors.primary,
    },
    orgName: {
      ...typography.title,
      fontSize: 26,
      lineHeight: 32,
      color: themeColors.labelPrimary,
    },
    rolePill: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radii.pill,
      backgroundColor: colorWithAlpha(themeColors.primary, isDark ? 0.2 : 0.12),
    },
    rolePillLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600' as const,
      color: themeColors.primary,
    },
    details: {
      gap: spacing.md,
      paddingTop: spacing.xs,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: themeColors.separator,
    },
    chips: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
      marginTop: 4,
    },
    chip: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radii.pill,
      backgroundColor: colorWithAlpha(themeColors.labelPrimary, isDark ? 0.08 : 0.05),
    },
    chipLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      color: themeColors.labelSecondary,
    },
  }));

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={heroGradient}
        locations={[0, 0.28, 0.55, 0.75, 0.9, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Clinic invitation</Text>
          <Text style={styles.orgName}>{preview.organization_name || 'Clinic group'}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillLabel}>{inviteTitle}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.details}>
          <InviteDetailRow icon="person-outline" label="Invited by" value={inviterLabel} />
          {preview.email ? (
            <InviteDetailRow icon="mail-outline" label="Invited email" value={preview.email} />
          ) : null}
          {locationNames.length > 0 ? (
            <View>
              <InviteDetailRow
                icon="business-outline"
                label={locationNames.length === 1 ? 'Location' : 'Locations'}
                value={
                  locationNames.length === 1
                    ? locationNames[0]!
                    : `${locationNames.length} clinics assigned`
                }
              />
              {locationNames.length > 1 ? (
                <View style={styles.chips}>
                  {locationNames.map((name) => (
                    <View key={name} style={styles.chip}>
                      <Text style={styles.chipLabel}>{name}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
          {expiresLabel ? (
            <InviteDetailRow icon="time-outline" label="Expires" value={expiresLabel} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function AcceptClinicInviteScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const { session, profile, refreshProfile } = useAuth();
  const { refreshClinicProfile } = useClinicProfile();
  const { colors } = useTheme();
  const [token, setToken] = useState(
    typeof params.token === 'string' ? params.token : '',
  );
  const [preview, setPreview] = useState<ClinicInvitationPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCodeEntry, setShowCodeEntry] = useState(!params.token);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    hint: typography.subtitle,
    action: { ...typography.body, color: colors.primary, fontWeight: '600' as const },
    errorBox: {
      gap: spacing.sm,
      backgroundColor: `${colors.destructive}14`,
      borderRadius: 12,
      padding: spacing.md,
    },
    errorText: {
      ...typography.subtitle,
      color: colors.destructive,
    },
  }));

  useEffect(() => {
    const next = typeof params.token === 'string' ? params.token.trim() : '';
    if (next) {
      setToken(next);
      setShowCodeEntry(false);
      void saveClinicInviteToken(next);
    }
  }, [params.token]);

  const loadPreview = useCallback(async (value: string) => {
    if (!value.trim()) {
      setPreview(null);
      return;
    }
    setIsLoadingPreview(true);
    setSubmitError(null);
    try {
      const next = await previewClinicManagerInvitation(value.trim());
      setPreview(next);
      if (next.status === 'not_found') {
        setSubmitError('Invitation not found. Check the link or code and try again.');
      } else if (next.status === 'expired') {
        setSubmitError('This invitation has expired. Ask the clinic owner to resend it.');
      } else if (next.status === 'revoked') {
        setSubmitError('This invitation was revoked. Ask the clinic owner for a new one.');
      } else if (next.status === 'accepted') {
        setSubmitError('This invitation has already been accepted.');
      }
    } catch (error) {
      setPreview(null);
      setSubmitError(error instanceof Error ? error.message : 'Could not load invitation.');
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (token.trim()) {
      void loadPreview(token);
    }
  }, [loadPreview, token]);

  const signedInEmail = session?.user.email?.trim().toLowerCase() ?? '';
  const invitedEmail = preview?.email?.trim().toLowerCase() ?? '';
  const emailMismatch = Boolean(
    session && preview?.status === 'pending' && invitedEmail && signedInEmail !== invitedEmail,
  );

  const previewStatusMessage = useMemo(() => {
    if (!preview || preview.status === 'pending') return null;
    if (preview.status === 'expired') return 'This invitation has expired.';
    if (preview.status === 'revoked') return 'This invitation was revoked.';
    if (preview.status === 'accepted') return 'This invitation was already accepted.';
    return 'Invitation not found.';
  }, [preview]);

  if (!isClinicGroupsEnabled()) {
    return <Redirect href={CLINIC_SETUP_ACCOUNT_TYPE} />;
  }

  if (!session) {
    const encoded = encodeURIComponent(token.trim());
    const signInHref = token.trim()
      ? (`/(onboarding)/sign-in?inviteToken=${encoded}` as const)
      : ('/(onboarding)/sign-in' as const);
    return <Redirect href={signInHref} />;
  }

  const handleAccept = async () => {
    if (!token.trim()) {
      setSubmitError('Paste the invitation code from your clinic owner.');
      setShowCodeEntry(true);
      return;
    }
    if (emailMismatch) {
      setSubmitError(`Sign in with ${preview?.email} to accept this invitation.`);
      return;
    }
    if (preview && preview.status !== 'pending') {
      setSubmitError(previewStatusMessage ?? 'This invitation cannot be accepted.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await acceptClinicManagerInvitation(token.trim());
      await clearClinicInviteToken();
      await refreshProfile();
      await refreshClinicProfile();
      router.replace(CLINIC_HOME);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not accept invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    setIsSwitchingAccount(true);
    setSubmitError(null);
    try {
      if (token.trim()) {
        await saveClinicInviteToken(token.trim());
      }
      await signOut();
      router.replace(
        `/(onboarding)/sign-in?inviteToken=${encodeURIComponent(token.trim())}` as const,
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not switch accounts.');
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  const canJoin =
    Boolean(token.trim()) &&
    !emailMismatch &&
    (!preview || preview.status === 'pending') &&
    !isLoadingPreview;

  const inviteTitle = preview?.title?.trim() || 'Manager';
  const inviterLabel =
    preview?.inviter_name?.trim() || preview?.organization_name?.trim() || 'the clinic';

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <SetupStepFooter
          canContinue={emailMismatch ? Boolean(token.trim()) : canJoin}
          validationMessage={
            emailMismatch
              ? `Sign in as ${preview?.email} to accept this invitation.`
              : 'Enter your invitation code.'
          }
          showValidation={Boolean(submitError) && !token.trim()}
          submitError={submitError}
          isSubmitting={isSubmitting || isSwitchingAccount}
          continueLabel={emailMismatch ? 'Switch account' : 'Join clinic group'}
          onContinue={emailMismatch ? handleSwitchAccount : handleAccept}
        />
      }>
      <AuthScreenHeader
        title="Join a clinic group"
        subtitle={
          emailMismatch
            ? `This invite is for ${preview?.email}. Switch accounts to continue.`
            : 'Review your invitation, then join with the invited email.'
        }
        onBack={() => router.back()}
      />
      <View style={styles.form}>
        <Text style={styles.hint}>
          Signed in as {session.user.email}
          {profile?.role && profile.role !== 'clinic'
            ? '. Your role will switch to clinic when you accept.'
            : '.'}
        </Text>

        {emailMismatch ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              This invitation was sent to {preview?.email}. You are signed in as{' '}
              {session.user.email}. Switch to that account to join.
            </Text>
            <Pressable onPress={() => void handleSwitchAccount()}>
              <Text style={styles.action}>
                {isSwitchingAccount ? 'Switching…' : 'Switch account'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {preview?.status === 'pending' ? (
          <ClinicInvitePreviewCard
            preview={preview}
            inviteTitle={inviteTitle}
            inviterLabel={inviterLabel}
          />
        ) : null}

        {isLoadingPreview ? <Text style={styles.hint}>Loading invitation…</Text> : null}

        {showCodeEntry || !token.trim() || (preview && preview.status !== 'pending') ? (
          <AuthField
            label="Invitation code"
            placeholder="Paste invitation token"
            value={token}
            onChangeText={(value) => {
              setToken(value);
              void saveClinicInviteToken(value);
            }}
            autoCapitalize="none"
          />
        ) : (
          <Pressable onPress={() => setShowCodeEntry(true)}>
            <Text style={styles.action}>Enter a different code</Text>
          </Pressable>
        )}
      </View>
    </OnboardingShell>
  );
}
