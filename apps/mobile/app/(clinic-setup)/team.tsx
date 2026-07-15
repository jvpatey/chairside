import {
  createClinicManagerInvitation,
  listClinicInvitations,
  listClinicLocations,
  resendClinicManagerInvitation,
  revokeClinicManagerInvitation,
  type ClinicInvitation,
  type ClinicLocation,
} from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { ChipSelector } from '@/components/clinic/ChipSelector';
import { EmptyState } from '@/components/ui/EmptyState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { buildClinicManagerInviteUrl, formatInviteExpiry } from '@/lib/clinicInviteLinks';
import { copyToClipboard } from '@/lib/copyToClipboard';
import { CLINIC_SETUP_ABOUT } from '@/lib/routing';
import { getClinicSetupStepNumber } from '@/lib/clinicSetupSteps';
import { useTheme, useThemedStyles } from '@/theme';

export default function ClinicTeamSetupScreen() {
  const { clinicId, isGroup } = useClinicProfile();
  const { colors } = useTheme();
  const progress = getClinicSetupStepNumber('team', true);
  const [invitations, setInvitations] = useState<ClinicInvitation[]>([]);
  const [locations, setLocations] = useState<ClinicLocation[]>([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('Office Manager');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [lastInvite, setLastInvite] = useState<ClinicInvitation | null>(null);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.md },
    list: { gap: spacing.sm },
    cardTitle: { ...typography.body, fontWeight: '600' as const },
    cardMeta: typography.subtitle,
    actions: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    addButton: { paddingVertical: spacing.sm, alignItems: 'center' as const },
    addLabel: { ...typography.body, color: colors.primary, fontWeight: '600' as const },
    danger: { ...typography.body, color: colors.destructive, fontWeight: '600' as const },
    statusBox: {
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
      gap: spacing.xs,
    },
  }));

  const locationOptions = useMemo(
    () =>
      locations
        .filter((location) => location.is_active)
        .map((location) => ({ value: location.id, label: location.name })),
    [locations],
  );

  const reload = useCallback(async () => {
    if (!clinicId) return;
    const [nextInvites, nextLocations] = await Promise.all([
      listClinicInvitations(clinicId),
      listClinicLocations(clinicId, { activeOnly: true }),
    ]);
    setInvitations(nextInvites.filter((invite) => invite.status === 'pending'));
    setLocations(nextLocations);
  }, [clinicId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!isGroup) {
    router.replace(CLINIC_SETUP_ABOUT);
    return null;
  }

  const copyInviteLink = async (token: string) => {
    const url = buildClinicManagerInviteUrl(token);
    await copyToClipboard(url);
    setStatusMessage('Invite link copied. Email delivery may take a moment.');
    if (Platform.OS !== 'web') {
      Alert.alert('Link copied', 'Share this link if the invite email has not arrived yet.');
    }
  };

  const handleInvite = async () => {
    if (!clinicId || !email.trim()) {
      setSubmitError('Enter a manager email to send an invitation.');
      return;
    }
    if (locationOptions.length > 0 && selectedLocationIds.length === 0) {
      setSubmitError('Select at least one location to assign.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setStatusMessage(null);
    try {
      const invite = await createClinicManagerInvitation({
        organizationId: clinicId,
        email: email.trim(),
        displayName: displayName.trim() || null,
        title: title.trim() || 'Manager',
        locationIds: selectedLocationIds,
      });
      setLastInvite(invite);
      setStatusMessage(
        `Invitation sent to ${invite.email}. They’ll get an email with a join link shortly.`,
      );
      setEmail('');
      setDisplayName('');
      setSelectedLocationIds([]);
      setShowForm(false);
      await reload();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not send invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (invite: ClinicInvitation) => {
    setBusyInviteId(invite.id);
    setSubmitError(null);
    try {
      const next = await resendClinicManagerInvitation(invite.id);
      setLastInvite(next);
      setStatusMessage(`Invitation resent to ${next.email}.`);
      await reload();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not resend invitation.');
    } finally {
      setBusyInviteId(null);
    }
  };

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <SetupStepFooter
          canContinue
          validationMessage={null}
          showValidation={false}
          submitError={submitError}
          isSubmitting={false}
          continueLabel="Continue"
          onContinue={() => router.push(CLINIC_SETUP_ABOUT)}
        />
      }>
      <AuthScreenHeader
        title="Invite managers"
        subtitle="Optional. Managers get an email invite and only see assigned locations."
        onBack={() => router.back()}
      />
      <SetupStepProgress step={progress.step} total={progress.total} />
      <View style={styles.form}>
        {invitations.length === 0 && !showForm ? (
          <EmptyState
            icon="people-outline"
            title="No managers yet"
            message="You can skip this and invite your team from Profile later."
          />
        ) : (
          <View style={styles.list}>
            {invitations.map((invite) => (
              <SurfaceCard key={invite.id}>
                <Text style={styles.cardTitle}>{invite.display_name || invite.email}</Text>
                <Text style={styles.cardMeta}>
                  {invite.email} · Pending · {invite.location_ids.length} location
                  {invite.location_ids.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.cardMeta}>Expires {formatInviteExpiry(invite.expires_at)}</Text>
                <View style={styles.actions}>
                  <Pressable
                    disabled={busyInviteId === invite.id}
                    onPress={() => void handleResend(invite)}>
                    <Text style={styles.addLabel}>
                      {busyInviteId === invite.id ? 'Resending…' : 'Resend'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => void copyInviteLink(invite.token)}>
                    <Text style={styles.addLabel}>Copy link</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      void revokeClinicManagerInvitation(invite.id).then(() => reload())
                    }>
                    <Text style={styles.danger}>Revoke</Text>
                  </Pressable>
                </View>
              </SurfaceCard>
            ))}
          </View>
        )}

        {statusMessage || lastInvite ? (
          <View style={styles.statusBox}>
            <Text style={styles.cardTitle}>Invitation sent</Text>
            <Text style={styles.cardMeta}>
              {statusMessage ??
                `Invitation created for ${lastInvite?.email}. Copy the link below if email is delayed.`}
            </Text>
            {lastInvite ? (
              <Pressable onPress={() => void copyInviteLink(lastInvite.token)}>
                <Text style={styles.addLabel}>Copy invite link</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {showForm ? (
          <View style={styles.form}>
            <AuthField
              label="Manager name"
              placeholder="Sarah Mitchell"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <AuthField
              label="Email"
              placeholder="manager@clinic.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <AuthField
              label="Title"
              placeholder="Office Manager"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="words"
            />
            {locationOptions.length > 0 ? (
              <View style={styles.form}>
                <Text style={styles.cardTitle}>Assign locations</Text>
                <ChipSelector
                  options={locationOptions}
                  selected={selectedLocationIds}
                  multiple
                  horizontal={false}
                  onChange={(value) => setSelectedLocationIds(value as string[])}
                />
              </View>
            ) : null}
            <SetupStepFooter
              canContinue={
                Boolean(email.trim()) &&
                (locationOptions.length === 0 || selectedLocationIds.length > 0)
              }
              validationMessage={
                !email.trim()
                  ? 'Enter an email address.'
                  : 'Select at least one location to assign.'
              }
              showValidation={Boolean(submitError)}
              submitError={null}
              isSubmitting={isSubmitting}
              continueLabel="Send invite"
              onContinue={handleInvite}
            />
          </View>
        ) : (
          <Pressable style={styles.addButton} onPress={() => setShowForm(true)}>
            <Text style={styles.addLabel}>Invite a manager</Text>
          </Pressable>
        )}
      </View>
    </OnboardingShell>
  );
}
