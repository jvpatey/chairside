import {
  acceptClinicManagerInvitation,
  isClinicGroupsEnabled,
  previewClinicManagerInvitation,
  signOut,
  type ClinicInvitationPreview,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { PillBadge } from '@/components/ui/PillBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  clearClinicInviteToken,
  saveClinicInviteToken,
} from '@/lib/clinicInviteSession';
import { resolveAuthenticatedRoute } from '@/lib/resolveAuthenticatedRoute';
import { CLINIC_HOME, CLINIC_SETUP_ACCOUNT_TYPE } from '@/lib/routing';
import {
  webHover,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import {
  colorWithAlpha,
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
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: themeColors.primarySubtle,
      flexShrink: 0,
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
  const { colors } = useTheme();
  const locationNames = preview.location_names ?? [];
  const expiresLabel = formatExpiry(preview.expires_at);

  const styles = useThemedStyles(({ colors: themeColors, spacing, radii, typography }) => ({
    content: {
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
      fontSize: 24,
      lineHeight: 30,
      color: themeColors.labelPrimary,
    },
    details: {
      gap: spacing.md,
      paddingTop: spacing.xs,
    },
    chips: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
      marginTop: 4,
      paddingLeft: 44,
    },
    chip: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radii.pill,
      backgroundColor: colorWithAlpha(themeColors.labelPrimary, 0.06),
    },
    chipLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      color: themeColors.labelSecondary,
    },
  }));

  return (
    <SurfaceCard padding="lg" elevationLevel="subtle">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Clinic invitation</Text>
          <Text style={styles.orgName}>{preview.organization_name || 'Clinic group'}</Text>
          <PillBadge
            label={inviteTitle}
            color={colors.primary}
            backgroundColor={colors.primarySubtle}
            size="sm"
          />
        </View>

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
    </SurfaceCard>
  );
}

export default function AcceptClinicInviteScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const { session, profile, refreshProfile } = useAuth();
  const { refreshClinicProfile } = useClinicProfile();
  const { completeOnboarding } = useOnboarding();
  const [token, setToken] = useState(
    typeof params.token === 'string' ? params.token : '',
  );
  const [preview, setPreview] = useState<ClinicInvitationPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCodeEntry, setShowCodeEntry] = useState(!params.token);
  const didAutoContinueRef = useRef(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    form: { gap: spacing.lg },
    hint: {
      ...typography.subtitle,
      color: colors.labelSecondary,
    },
    actionPressable: {
      alignSelf: 'flex-start' as const,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    actionPressableHovered: webTextLinkHoverStyles(colors),
    action: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600' as const,
    },
  }));

  useEffect(() => {
    const next = typeof params.token === 'string' ? params.token.trim() : '';
    if (next) {
      setToken(next);
      setShowCodeEntry(false);
      // Only persist after preview confirms pending — revoked links must not re-trap sign-in.
    }
  }, [params.token]);

  const loadPreview = useCallback(async (value: string) => {
    if (!value.trim()) {
      setPreview(null);
      return;
    }
    setIsLoadingPreview(true);
    setSubmitError(null);
    setPreview(null);
    try {
      const next = await previewClinicManagerInvitation(value.trim());
      setPreview(next);
      if (next.status === 'pending') {
        await saveClinicInviteToken(value.trim());
        return;
      }
      await clearClinicInviteToken();
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

  const handleContinueWithoutInvite = useCallback(async () => {
    if (!session) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await clearClinicInviteToken();
      const { href, role } = await resolveAuthenticatedRoute({
        userId: session.user.id,
        profile,
        refreshProfile,
      });
      if (role) {
        await completeOnboarding(role);
      }
      router.replace(href);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not continue.');
    } finally {
      setIsSubmitting(false);
    }
  }, [completeOnboarding, profile, refreshProfile, session]);

  const inviteUnusable = Boolean(
    preview && preview.status !== 'pending' && !isLoadingPreview,
  );

  // Signed-in users hitting a dead invite link should leave automatically.
  useEffect(() => {
    if (!session || !inviteUnusable || didAutoContinueRef.current) return;
    didAutoContinueRef.current = true;
    void handleContinueWithoutInvite();
  }, [handleContinueWithoutInvite, inviteUnusable, session]);

  const canJoin =
    Boolean(token.trim()) &&
    !emailMismatch &&
    (!preview || preview.status === 'pending') &&
    !isLoadingPreview;

  const inviteTitle = preview?.title?.trim() || 'Manager';
  const inviterLabel =
    preview?.inviter_name?.trim() || preview?.organization_name?.trim() || 'the clinic';

  const mismatchMessage = emailMismatch
    ? `This invitation was sent to ${preview?.email}. You are signed in as ${session.user.email}. Switch to that account to join.`
    : null;

  return (
    <OnboardingShell
      atmosphere="form"
      webLayout="centeredDecision"
      footer={
        <SetupStepFooter
          canContinue={
            emailMismatch ? Boolean(token.trim()) : inviteUnusable ? true : canJoin
          }
          validationMessage={
            emailMismatch
              ? `Sign in as ${preview?.email} to accept this invitation.`
              : 'Enter your invitation code.'
          }
          showValidation={Boolean(submitError) && !token.trim()}
          submitError={submitError}
          isSubmitting={isSubmitting || isSwitchingAccount}
          continueLabel={
            emailMismatch
              ? 'Switch account'
              : inviteUnusable
                ? 'Continue'
                : 'Join clinic group'
          }
          onContinue={
            emailMismatch
              ? handleSwitchAccount
              : inviteUnusable
                ? handleContinueWithoutInvite
                : handleAccept
          }
        />
      }>
      <AuthScreenHeader
        title="Join a clinic group"
        subtitle={
          emailMismatch
            ? `This invite is for ${preview?.email}. Switch accounts to continue.`
            : inviteUnusable
              ? 'This invitation cannot be used. Continue to your account, or enter a different code.'
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

        {mismatchMessage ? (
          <SurfaceCard padding="md" gap>
            <FormErrorBanner message={mismatchMessage} />
            <Pressable
              onPress={() => void handleSwitchAccount()}
              style={({ hovered, pressed }) => [
                styles.actionPressable,
                webHover(hovered, pressed, styles.actionPressableHovered),
              ]}>
              <Text style={styles.action}>
                {isSwitchingAccount ? 'Switching…' : 'Switch account'}
              </Text>
            </Pressable>
          </SurfaceCard>
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
          <Pressable
            onPress={() => setShowCodeEntry(true)}
            style={({ hovered, pressed }) => [
              styles.actionPressable,
              webHover(hovered, pressed, styles.actionPressableHovered),
            ]}>
            <Text style={styles.action}>Enter a different code</Text>
          </Pressable>
        )}
      </View>
    </OnboardingShell>
  );
}
