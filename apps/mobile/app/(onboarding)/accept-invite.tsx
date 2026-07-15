import {
  acceptClinicManagerInvitation,
  isClinicGroupsEnabled,
  previewClinicManagerInvitation,
  signOut,
  type ClinicInvitationPreview,
} from '@chairside/api';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import {
  clearClinicInviteToken,
  saveClinicInviteToken,
} from '@/lib/clinicInviteSession';
import { CLINIC_HOME, CLINIC_SETUP_ACCOUNT_TYPE } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

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
    form: { gap: spacing.md },
    hint: typography.subtitle,
    cardTitle: { ...typography.body, fontWeight: '600' as const },
    cardMeta: typography.subtitle,
    action: { ...typography.body, color: colors.primary, fontWeight: '600' as const },
    errorBox: {
      ...typography.subtitle,
      color: colors.destructive,
      backgroundColor: `${colors.destructive}14`,
      borderRadius: 12,
      padding: spacing.md,
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

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <SetupStepFooter
          canContinue={canJoin}
          validationMessage={
            emailMismatch
              ? `Sign in with ${preview?.email} to accept this invitation.`
              : 'Enter your invitation code.'
          }
          showValidation={Boolean(submitError) && !token.trim()}
          submitError={submitError}
          isSubmitting={isSubmitting || isSwitchingAccount}
          continueLabel="Join clinic group"
          onContinue={handleAccept}
        />
      }>
      <AuthScreenHeader
        title="Join a clinic group"
        subtitle="Review your invitation, then join with the invited email."
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
            <Text>
              This invitation was sent to {preview?.email}. You are signed in as {session.user.email}.
            </Text>
            <Pressable onPress={() => void handleSwitchAccount()}>
              <Text style={styles.action}>
                {isSwitchingAccount ? 'Switching…' : 'Switch account'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {preview?.status === 'pending' ? (
          <SurfaceCard>
            <Text style={styles.cardTitle}>{preview.organization_name}</Text>
            <Text style={styles.cardMeta}>
              Invited by {preview.inviter_name}
              {preview.title ? ` · ${preview.title}` : ''}
            </Text>
            <Text style={styles.cardMeta}>For {preview.email}</Text>
            {(preview.location_names ?? []).length > 0 ? (
              <Text style={styles.cardMeta}>
                Locations: {(preview.location_names ?? []).join(', ')}
              </Text>
            ) : null}
            {formatExpiry(preview.expires_at) ? (
              <Text style={styles.cardMeta}>Expires {formatExpiry(preview.expires_at)}</Text>
            ) : null}
          </SurfaceCard>
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
