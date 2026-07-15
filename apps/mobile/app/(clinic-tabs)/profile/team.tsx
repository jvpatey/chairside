import {
  createClinicManagerInvitation,
  isClinicGroupsEnabled,
  listClinicInvitations,
  listClinicMemberships,
  removeClinicManager,
  resendClinicManagerInvitation,
  revokeClinicManagerInvitation,
  setManagerLocationAssignments,
  transferClinicOrganizationOwnership,
  updateClinicMembershipProfile,
  type ClinicInvitation,
  type ClinicMembership,
} from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { EditPillButton } from '@/components/ui/EditPillButton';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { buildClinicManagerInviteUrl, formatInviteExpiry } from '@/lib/clinicInviteLinks';
import { copyToClipboard } from '@/lib/copyToClipboard';
import { CLINIC_ACCEPT_INVITE, CLINIC_PROFILE_LOCATIONS, navigateToClinicProfileHub } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

async function confirmDestructiveAction(
  title: string,
  message: string,
  confirmLabel: string,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : false;
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

function roleLabel(role: ClinicMembership['role']): string {
  return role === 'owner' ? 'Owner' : 'Manager';
}

export default function ClinicTeamSettingsScreen() {
  const {
    clinicId,
    locations,
    accessibleLocations,
    organization,
    clinicProfile,
    isOwner,
    isGroup,
    isClinicProfileReady,
    membership,
    refreshClinicProfile,
  } = useClinicProfile();
  const { colors } = useTheme();
  const groupsEnabled = isClinicGroupsEnabled();

  useEffect(() => {
    if (!isClinicProfileReady) return;
    if (!groupsEnabled || !isGroup) {
      navigateToClinicProfileHub(router);
    }
  }, [groupsEnabled, isClinicProfileReady, isGroup]);

  const [members, setMembers] = useState<ClinicMembership[]>([]);
  const [invitations, setInvitations] = useState<ClinicInvitation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileTitle, setProfileTitle] = useState('');
  const [showProfileValidation, setShowProfileValidation] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('Office Manager');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string[]>>({});
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<ClinicInvitation | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInviteValidation, setShowInviteValidation] = useState(false);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: { gap: spacing.lg },
    form: { gap: spacing.md },
    actions: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
      marginTop: spacing.sm,
      alignItems: 'center' as const,
    },
    danger: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      minHeight: 36,
      justifyContent: 'center' as const,
    },
    dangerLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.destructive,
    },
    actionLink: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      minHeight: 36,
      justifyContent: 'center' as const,
    },
    actionLinkLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    cancel: {
      alignSelf: 'center' as const,
      paddingVertical: spacing.sm,
    },
    cancelLabel: {
      ...typography.subtitle,
      fontSize: 15,
      color: colors.labelSecondary,
      fontWeight: '600' as const,
    },
    hint: profileSettingsHintStyle({ typography, colors }),
    statusBox: {
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
      gap: spacing.xs,
    },
    statusTitle: {
      ...typography.body,
      fontWeight: '600' as const,
      fontSize: 15,
    },
    pendingStatus: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: `${colors.warning}22`,
    },
    pendingStatusLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600' as const,
      color: colors.warning,
    },
  }));

  const groupName =
    organization?.name?.trim() || clinicProfile?.clinic_name?.trim() || 'your group';

  const locationOptions = useMemo(
    () =>
      locations
        .filter((location) => location.is_active)
        .map((location) => ({ value: location.id, label: location.name })),
    [locations],
  );

  const locationNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const location of locations) {
      map.set(location.id, location.name);
    }
    return map;
  }, [locations]);

  const managers = useMemo(
    () => members.filter((member) => member.role === 'manager'),
    [members],
  );
  const owners = useMemo(
    () => members.filter((member) => member.role === 'owner'),
    [members],
  );

  const assignedLocationNames = useMemo(() => {
    const ids = membership?.location_ids ?? accessibleLocations.map((location) => location.id);
    return ids
      .map((id) => locationNameById.get(id) ?? accessibleLocations.find((l) => l.id === id)?.name)
      .filter(Boolean) as string[];
  }, [accessibleLocations, locationNameById, membership?.location_ids]);

  const canInvite =
    Boolean(email.trim()) &&
    (locationOptions.length === 0 || selectedLocationIds.length > 0);
  const inviteValidationMessage =
    !email.trim()
      ? 'Enter a manager email.'
      : locationOptions.length > 0 && selectedLocationIds.length === 0
        ? 'Select at least one location to assign.'
        : null;
  const canSaveProfile = Boolean(profileDisplayName.trim());
  const profileValidationMessage = canSaveProfile ? null : 'Enter your name.';

  const reload = useCallback(async () => {
    if (!clinicId) return;
    const [nextMembers, nextInvites] = await Promise.all([
      listClinicMemberships(clinicId),
      listClinicInvitations(clinicId),
    ]);
    setMembers(nextMembers);
    setInvitations(nextInvites.filter((invite) => invite.status === 'pending'));
    setAssignmentDrafts({});
  }, [clinicId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const resetInviteForm = () => {
    setShowForm(false);
    setEmail('');
    setDisplayName('');
    setTitle('Office Manager');
    setSelectedLocationIds([]);
    setError(null);
    setShowInviteValidation(false);
  };

  const startInvite = () => {
    setShowProfileForm(false);
    setSelectedLocationIds([]);
    setShowForm(true);
    setError(null);
    setShowInviteValidation(false);
    setStatusMessage(null);
  };

  const startEditProfile = () => {
    setShowForm(false);
    setProfileDisplayName(membership?.display_name?.trim() || '');
    setProfileTitle(
      membership?.title?.trim() || (isOwner ? 'Owner' : 'Manager'),
    );
    setShowProfileValidation(false);
    setError(null);
    setShowProfileForm(true);
  };

  const resetProfileForm = () => {
    setShowProfileForm(false);
    setShowProfileValidation(false);
    setError(null);
  };

  const handleBack = () => {
    if (showProfileForm) {
      resetProfileForm();
      return;
    }
    if (showForm && isOwner) {
      resetInviteForm();
      return;
    }
    navigateToClinicProfileHub(router);
  };

  const handleSaveProfile = async () => {
    if (!membership?.id || !canSaveProfile) {
      setShowProfileValidation(true);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await updateClinicMembershipProfile(membership.id, {
        display_name: profileDisplayName.trim(),
        title: profileTitle.trim() || (isOwner ? 'Owner' : 'Manager'),
      });
      await refreshClinicProfile();
      await reload();
      setStatusMessage('Your profile was updated.');
      resetProfileForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update your profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const url = buildClinicManagerInviteUrl(token);
    await copyToClipboard(url);
    setStatusMessage('Invite link copied. Email delivery may take a moment.');
    if (Platform.OS !== 'web') {
      Alert.alert('Link copied', 'Share this link if the invite email has not arrived yet.');
    }
  };

  const getMemberAssignmentDraft = (member: ClinicMembership) =>
    assignmentDrafts[member.id] ?? member.location_ids ?? [];

  const handleSaveAssignments = async (member: ClinicMembership) => {
    const nextIds = getMemberAssignmentDraft(member);
    if (locationOptions.length > 0 && nextIds.length === 0) {
      setError('Assign at least one location.');
      return;
    }
    setSavingMemberId(member.id);
    setError(null);
    try {
      await setManagerLocationAssignments(member.id, nextIds);
      await reload();
      setStatusMessage(`Updated locations for ${member.display_name || 'manager'}.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Could not update location assignments.',
      );
    } finally {
      setSavingMemberId(null);
    }
  };

  const handleInvite = async () => {
    if (!clinicId || !canInvite) {
      setShowInviteValidation(true);
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
      resetInviteForm();
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

  const handleTransferOwnership = async (member: ClinicMembership) => {
    if (!clinicId) return;
    const confirmed = await confirmDestructiveAction(
      'Transfer ownership?',
      `${member.display_name || 'This manager'} will become the owner of ${groupName}.`,
      'Transfer',
    );
    if (!confirmed) return;
    try {
      setError(null);
      await transferClinicOrganizationOwnership(clinicId, member.id);
      await refreshClinicProfile();
      await reload();
      setStatusMessage('Ownership transferred.');
    } catch (transferError) {
      setError(
        transferError instanceof Error ? transferError.message : 'Could not transfer ownership.',
      );
    }
  };

  const handleRemoveManager = async (member: ClinicMembership) => {
    const confirmed = await confirmDestructiveAction(
      'Remove manager?',
      `${member.display_name || 'This manager'} will lose access immediately.`,
      'Remove',
    );
    if (!confirmed) return;
    try {
      setError(null);
      await removeClinicManager(member.id);
      await reload();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove manager.');
    }
  };

  const handleRevokeInvite = async (invite: ClinicInvitation) => {
    const confirmed = await confirmDestructiveAction(
      'Revoke invitation?',
      `The invite for ${invite.email} will no longer work.`,
      'Revoke',
    );
    if (!confirmed) return;
    try {
      setError(null);
      await revokeClinicManagerInvitation(invite.id);
      await reload();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Could not revoke invitation.');
    }
  };

  if (!isClinicProfileReady || !groupsEnabled || !isGroup) {
    return null;
  }

  if (showProfileForm) {
    return (
      <ProfileDetailScreen
        title="Your profile"
        subtitle={`How you appear when posting and managing ${groupName}.`}
        onBack={handleBack}>
        <View style={styles.form}>
          <AuthField
            label="Your name"
            placeholder={isOwner ? 'Alex Rivera' : 'Sarah Mitchell'}
            value={profileDisplayName}
            onChangeText={setProfileDisplayName}
            autoCapitalize="words"
            invalid={showProfileValidation && !canSaveProfile}
          />
          <AuthField
            label="Your title"
            placeholder={isOwner ? 'Owner' : 'Office Manager'}
            value={profileTitle}
            onChangeText={setProfileTitle}
            autoCapitalize="words"
          />
          <SetupStepFooter
            canContinue={canSaveProfile}
            validationMessage={profileValidationMessage}
            showValidation={showProfileValidation}
            submitError={error}
            isSubmitting={isSubmitting}
            continueLabel="Save changes"
            onContinue={() => void handleSaveProfile()}
          />
          <Pressable style={styles.cancel} onPress={resetProfileForm}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </ProfileDetailScreen>
    );
  }

  // Manager: view of their own access (+ edit profile).
  if (!isOwner) {
    return (
      <ProfileDetailScreen
        title="Team & access"
        subtitle={`Your access for ${groupName}.`}
        actionLabel="Edit profile"
        onActionPress={startEditProfile}
        onBack={() => navigateToClinicProfileHub(router)}>
        <ProfileDetailStack>
          <SectionPanel icon="person-outline" title={membership?.display_name || 'Manager'}>
            <Text style={styles.hint}>
              Ask the owner to update your location access if something looks wrong.
            </Text>
            <FieldBlock label="Role">
              <FieldValue value="Manager" />
            </FieldBlock>
            <FieldDivider />
            <FieldBlock label="Title">
              <FieldValue value={membership?.title ?? 'Manager'} />
            </FieldBlock>
            <FieldDivider />
            <FieldBlock label="Clinics you manage">
              <FieldValue
                value={
                  assignedLocationNames.length > 0
                    ? assignedLocationNames.join(', ')
                    : null
                }
              />
            </FieldBlock>
            <View style={styles.actions}>
              <EditPillButton label="Edit profile" onPress={startEditProfile} />
            </View>
          </SectionPanel>
          <Pressable
            accessibilityRole="button"
            style={styles.actionLink}
            onPress={() => router.push(CLINIC_ACCEPT_INVITE)}>
            <Text style={styles.actionLinkLabel}>Have an invite link?</Text>
          </Pressable>
        </ProfileDetailStack>
      </ProfileDetailScreen>
    );
  }

  if (showForm) {
    return (
      <ProfileDetailScreen
        title="Invite manager"
        subtitle={`Give someone access to help run ${groupName}.`}
        onBack={handleBack}>
        <View style={styles.form}>
          {locationOptions.length === 0 ? (
            <EmptyState
              icon="business-outline"
              title="Add locations first"
              message="Create at least one location before inviting managers."
              ctaLabel="Go to Locations"
              onCtaPress={() => router.push(CLINIC_PROFILE_LOCATIONS)}
            />
          ) : (
            <>
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
                invalid={Boolean(error) && !email.trim()}
              />
              <AuthField
                label="Title"
                placeholder="Office Manager"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="words"
              />
              <Text style={styles.hint}>Assign the clinics this manager can access.</Text>
              <ChipSelector
                options={locationOptions}
                selected={selectedLocationIds}
                multiple
                horizontal={false}
                onChange={(value) => setSelectedLocationIds(value as string[])}
              />
              <SetupStepFooter
                canContinue={canInvite}
                validationMessage={inviteValidationMessage}
                showValidation={showInviteValidation}
                submitError={error}
                isSubmitting={isSubmitting}
                continueLabel="Send invitation"
                onContinue={() => void handleInvite()}
              />
              <Pressable style={styles.cancel} onPress={resetInviteForm}>
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
            </>
          )}
        </View>
      </ProfileDetailScreen>
    );
  }

  return (
    <ProfileDetailScreen
      title="Team & access"
      subtitle={`Manage who can help run ${groupName}.`}
      actionLabel={locationOptions.length > 0 ? 'Invite manager' : undefined}
      onActionPress={locationOptions.length > 0 ? startInvite : undefined}
      onBack={handleBack}>
      <View style={styles.content}>
        {error ? (
          <Text style={{ color: colors.destructive, fontWeight: '600' }}>{error}</Text>
        ) : null}

        {statusMessage || lastInvite ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>Invitation update</Text>
            <Text style={styles.hint}>
              {statusMessage ??
                `Invitation created for ${lastInvite?.email}. Copy the link if email is delayed.`}
            </Text>
            {lastInvite ? (
              <Pressable
                style={styles.actionLink}
                onPress={() => void copyInviteLink(lastInvite.token)}>
                <Text style={styles.actionLinkLabel}>Copy invite link</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {locationOptions.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title="Add locations first"
            message="Create at least one location before inviting managers."
            ctaLabel="Go to Locations"
            onCtaPress={() => router.push(CLINIC_PROFILE_LOCATIONS)}
          />
        ) : null}

        <ProfileDetailStack>
          {owners.map((member, index) => {
            const isSelf = member.id === membership?.id;
            return (
              <SectionPanel
                key={member.id}
                icon="shield-checkmark-outline"
                stepNumber={index + 1}
                stepAccent="primary"
                title={member.display_name || 'Owner'}>
                <FieldBlock label="Role">
                  <FieldValue value={roleLabel(member.role)} />
                </FieldBlock>
                <FieldDivider />
                <FieldBlock label="Title">
                  <FieldValue value={member.title || 'Owner'} />
                </FieldBlock>
                {isSelf ? (
                  <View style={styles.actions}>
                    <EditPillButton label="Edit profile" onPress={startEditProfile} />
                  </View>
                ) : null}
              </SectionPanel>
            );
          })}

          {managers.map((member, index) => {
            const draftIds = getMemberAssignmentDraft(member);
            const assignedNames = draftIds
              .map((id) => locationNameById.get(id))
              .filter(Boolean)
              .join(', ');

            return (
              <SectionPanel
                key={member.id}
                icon="people-outline"
                stepNumber={owners.length + index + 1}
                stepAccent={index % 2 === 0 ? 'secondary' : 'primary'}
                title={member.display_name || 'Manager'}>
                <FieldBlock label="Role">
                  <FieldValue value="Manager" />
                </FieldBlock>
                <FieldDivider />
                <FieldBlock label="Title">
                  <FieldValue value={member.title || 'Manager'} />
                </FieldBlock>
                <FieldDivider />
                <FieldBlock label="Assigned clinics">
                  <FieldValue value={assignedNames || null} />
                </FieldBlock>
                <Text style={[styles.hint, { marginTop: 8 }]}>Update clinic access</Text>
                <ChipSelector
                  options={locationOptions}
                  selected={draftIds}
                  multiple
                  horizontal={false}
                  onChange={(value) =>
                    setAssignmentDrafts((prev) => ({
                      ...prev,
                      [member.id]: value as string[],
                    }))
                  }
                />
                <View style={styles.actions}>
                  <EditPillButton
                    label={savingMemberId === member.id ? 'Saving…' : 'Save clinics'}
                    onPress={() => void handleSaveAssignments(member)}
                    showIcon={false}
                  />
                  <Pressable
                    style={styles.actionLink}
                    onPress={() => void handleTransferOwnership(member)}>
                    <Text style={styles.actionLinkLabel}>Make owner</Text>
                  </Pressable>
                  <Pressable
                    style={styles.danger}
                    onPress={() => void handleRemoveManager(member)}>
                    <Text style={styles.dangerLabel}>Remove</Text>
                  </Pressable>
                </View>
              </SectionPanel>
            );
          })}

          {invitations.length > 0
            ? invitations.map((invite, index) => (
                <SectionPanel
                  key={invite.id}
                  icon="mail-outline"
                  stepNumber={owners.length + managers.length + index + 1}
                  stepAccent="secondary"
                  title={invite.display_name || invite.email}>
                  <Text style={styles.hint}>
                    Manager waiting to accept invitation — they don’t have access yet.
                  </Text>
                  <FieldBlock label="Role">
                    <FieldValue value="Manager" />
                  </FieldBlock>
                  <FieldDivider />
                  <FieldBlock label="Status">
                    <View style={styles.pendingStatus}>
                      <Text style={styles.pendingStatusLabel}>Invitation pending</Text>
                    </View>
                  </FieldBlock>
                  <FieldDivider />
                  <FieldBlock label="Title">
                    <FieldValue value={invite.title || 'Manager'} />
                  </FieldBlock>
                  <FieldDivider />
                  <FieldBlock label="Email">
                    <FieldValue value={invite.email} />
                  </FieldBlock>
                  <FieldDivider />
                  <FieldBlock label="Assigned clinics">
                    <FieldValue
                      value={
                        invite.location_ids
                          .map((id) => locationNameById.get(id))
                          .filter(Boolean)
                          .join(', ') || null
                      }
                    />
                  </FieldBlock>
                  <FieldDivider />
                  <FieldBlock label="Expires">
                    <FieldValue value={formatInviteExpiry(invite.expires_at)} />
                  </FieldBlock>
                  <View style={styles.actions}>
                    <EditPillButton
                      label={busyInviteId === invite.id ? 'Resending…' : 'Resend'}
                      onPress={() => void handleResend(invite)}
                      showIcon={false}
                    />
                    <Pressable
                      style={styles.actionLink}
                      onPress={() => void copyInviteLink(invite.token)}>
                      <Text style={styles.actionLinkLabel}>Copy link</Text>
                    </Pressable>
                    <Pressable
                      style={styles.danger}
                      onPress={() => void handleRevokeInvite(invite)}>
                      <Text style={styles.dangerLabel}>Revoke</Text>
                    </Pressable>
                  </View>
                </SectionPanel>
              ))
            : null}
        </ProfileDetailStack>
      </View>
    </ProfileDetailScreen>
  );
}
