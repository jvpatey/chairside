import {
  createClinicManagerInvitation,
  listClinicInvitations,
  listClinicMemberships,
  removeClinicManager,
  resendClinicManagerInvitation,
  revokeClinicManagerInvitation,
  setManagerLocationAssignments,
  transferClinicOrganizationOwnership,
  type ClinicInvitation,
  type ClinicMembership,
} from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { buildClinicManagerInviteUrl, formatInviteExpiry } from '@/lib/clinicInviteLinks';
import { copyToClipboard } from '@/lib/copyToClipboard';
import { CLINIC_ACCEPT_INVITE, navigateToClinicProfileHub } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

export default function ClinicTeamSettingsScreen() {
  const { clinicId, locations, isOwner, membership, refreshClinicProfile } = useClinicProfile();
  const { colors } = useTheme();
  const [members, setMembers] = useState<ClinicMembership[]>([]);
  const [invitations, setInvitations] = useState<ClinicInvitation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('Office Manager');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [memberAssignIds, setMemberAssignIds] = useState<string[]>([]);
  const [lastInvite, setLastInvite] = useState<ClinicInvitation | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: { gap: spacing.lg },
    list: { gap: spacing.sm },
    title: { ...typography.body, fontWeight: '600' },
    meta: typography.subtitle,
    actions: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.md },
    action: { color: colors.primary, fontWeight: '600' as const },
    danger: { color: colors.destructive, fontWeight: '600' as const },
    form: { gap: spacing.md },
    error: { ...typography.subtitle, color: colors.destructive },
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
    const [nextMembers, nextInvites] = await Promise.all([
      listClinicMemberships(clinicId),
      listClinicInvitations(clinicId),
    ]);
    setMembers(nextMembers);
    setInvitations(nextInvites.filter((invite) => invite.status === 'pending'));
  }, [clinicId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const copyInviteLink = async (token: string) => {
    const url = buildClinicManagerInviteUrl(token);
    await copyToClipboard(url);
    setStatusMessage('Invite link copied. Email delivery may take a moment.');
    if (Platform.OS !== 'web') {
      Alert.alert('Link copied', 'Share this link if the invite email has not arrived yet.');
    }
  };

  if (!isOwner) {
    return (
      <ProfileDetailScreen onBack={() => navigateToClinicProfileHub(router)}>
        <View style={styles.content}>
          <SurfaceCard>
            <Text style={styles.title}>{membership?.display_name ?? 'Manager'}</Text>
            <Text style={styles.meta}>{membership?.title ?? 'Manager'}</Text>
            <Text style={styles.meta}>
              Ask the clinic owner to update your location access.
            </Text>
          </SurfaceCard>
          <Pressable onPress={() => router.push(CLINIC_ACCEPT_INVITE)}>
            <Text style={styles.action}>Have an invite link?</Text>
          </Pressable>
        </View>
      </ProfileDetailScreen>
    );
  }

  const handleInvite = async () => {
    if (!clinicId || !email.trim()) {
      setError('Enter a manager email.');
      return;
    }
    if (locationOptions.length > 0 && selectedLocationIds.length === 0) {
      setError('Select at least one location to assign.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
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
      setTitle('Office Manager');
      setSelectedLocationIds([]);
      setShowForm(false);
      await reload();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Could not send invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (invite: ClinicInvitation) => {
    setBusyInviteId(invite.id);
    setError(null);
    try {
      const next = await resendClinicManagerInvitation(invite.id);
      setLastInvite(next);
      setStatusMessage(`Invitation resent to ${next.email}.`);
      await reload();
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'Could not resend invitation.');
    } finally {
      setBusyInviteId(null);
    }
  };

  return (
    <ProfileDetailScreen onBack={() => navigateToClinicProfileHub(router)}>
      <View style={styles.content}>
        <View style={styles.list}>
          {members.map((member) => (
            <SurfaceCard key={member.id}>
              <Text style={styles.title}>
                {member.display_name || 'Team member'}
                {member.role === 'owner' ? ' · Owner' : ' · Manager'}
              </Text>
              <Text style={styles.meta}>{member.title || member.role}</Text>
              {member.role === 'manager' ? (
                <Text style={styles.meta}>
                  {(member.location_ids ?? []).length} assigned location
                  {(member.location_ids ?? []).length === 1 ? '' : 's'}
                </Text>
              ) : null}
              {member.role === 'manager' ? (
                <View style={styles.actions}>
                  <Pressable
                    onPress={() =>
                      void setManagerLocationAssignments(
                        member.id,
                        memberAssignIds.length > 0 ? memberAssignIds : member.location_ids ?? [],
                      ).then(() => reload())
                    }>
                    <Text style={styles.action}>Save location assignments</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Transfer ownership?', 'This manager will become the owner.', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Transfer',
                          onPress: () => {
                            if (!clinicId) return;
                            void transferClinicOrganizationOwnership(clinicId, member.id)
                              .then(() => refreshClinicProfile())
                              .then(() => reload());
                          },
                        },
                      ])
                    }>
                    <Text style={styles.action}>Make owner</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Remove manager?', 'They will lose access immediately.', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => {
                            void removeClinicManager(member.id).then(() => reload());
                          },
                        },
                      ])
                    }>
                    <Text style={styles.danger}>Remove</Text>
                  </Pressable>
                </View>
              ) : null}
            </SurfaceCard>
          ))}
        </View>

        {locationOptions.length > 0 ? (
          <View style={styles.form}>
            <Text style={styles.title}>Locations for invites / manager assignment</Text>
            <ChipSelector
              options={locationOptions}
              selected={showForm ? selectedLocationIds : memberAssignIds}
              multiple
              horizontal={false}
              onChange={(value) => {
                const next = value as string[];
                if (showForm) setSelectedLocationIds(next);
                else setMemberAssignIds(next);
              }}
            />
          </View>
        ) : (
          <EmptyState
            icon="business-outline"
            title="Add locations first"
            message="Create at least one location before inviting managers."
          />
        )}

        {invitations.length > 0 ? (
          <View style={styles.list}>
            <Text style={styles.title}>Pending invitations</Text>
            {invitations.map((invite) => (
              <SurfaceCard key={invite.id}>
                <Text style={styles.title}>{invite.display_name || invite.email}</Text>
                <Text style={styles.meta}>
                  {invite.email} · Pending · {invite.location_ids.length} location
                  {invite.location_ids.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.meta}>Expires {formatInviteExpiry(invite.expires_at)}</Text>
                <View style={styles.actions}>
                  <Pressable
                    disabled={busyInviteId === invite.id}
                    onPress={() => void handleResend(invite)}>
                    <Text style={styles.action}>
                      {busyInviteId === invite.id ? 'Resending…' : 'Resend'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => void copyInviteLink(invite.token)}>
                    <Text style={styles.action}>Copy link</Text>
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
        ) : null}

        {statusMessage || lastInvite ? (
          <View style={styles.statusBox}>
            <Text style={styles.title}>Invitation sent</Text>
            <Text style={styles.meta}>
              {statusMessage ??
                `Invitation created for ${lastInvite?.email}. Copy the link if email is delayed.`}
            </Text>
            {lastInvite ? (
              <Pressable onPress={() => void copyInviteLink(lastInvite.token)}>
                <Text style={styles.action}>Copy invite link</Text>
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable disabled={isSubmitting} onPress={() => void handleInvite()}>
              <Text style={styles.action}>{isSubmitting ? 'Sending…' : 'Send invitation'}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              setSelectedLocationIds([]);
              setShowForm(true);
            }}>
            <Text style={styles.action}>Invite a manager</Text>
          </Pressable>
        )}
      </View>
    </ProfileDetailScreen>
  );
}
