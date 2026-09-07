import { Ionicons } from '@expo/vector-icons';
import {
  completeClinicSetup,
  getMissingClinicProfileFields,
  listClinicInvitations,
  type ClinicInvitation,
  type ClinicLocation,
} from '@chairside/api';
import { SPECIALTY_OPTIONS, getTeamSizeRangeLabel, type TeamSizeRange } from '@chairside/config';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { PracticeDoctorReviewSection } from '@/components/clinic/PracticeDoctorList';
import { SetupBillingUpsellLink } from '@/components/billing/SetupBillingUpsellLink';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormScreen } from '@/components/ui/FormScreen';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
import { CLINIC_HOME_WELCOME } from '@/lib/routing';
import { fontSemibold, useThemedStyles } from '@/theme';

function specialtyLabel(specialty: string | null | undefined): string {
  if (!specialty) return 'General dentistry';
  return SPECIALTY_OPTIONS.find((item) => item.value === specialty)?.label ?? specialty;
}

function formatLocationAddress(location: ClinicLocation): string {
  return [location.address_line1, location.city, location.province, location.postal_code]
    .filter(Boolean)
    .join(', ');
}

function ReviewRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    label: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: typography.subtitle.color,
    },
    value: typography.body,
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );
}

function LocationReviewCard({ location }: { location: ClinicLocation }) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    title: {
      ...typography.body,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
      flexShrink: 1,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    badgeLabel: {
      ...typography.subtitle,
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
    meta: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
    },
  }));

  const practiceBits = [
    specialtyLabel(location.specialty),
    location.operatories_count != null ? `${location.operatories_count} operatories` : null,
    getTeamSizeRangeLabel(location.team_size_range as TeamSizeRange | null),
    location.software_used.length > 0 ? location.software_used.join(', ') : null,
  ].filter(Boolean);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{location.name}</Text>
        {location.is_primary ? (
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>Primary</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.meta}>{formatLocationAddress(location) || '—'}</Text>
      {practiceBits.length > 0 ? <Text style={styles.meta}>{practiceBits.join(' · ')}</Text> : null}
    </View>
  );
}

function ManagerReviewCard({
  invite,
  locations,
}: {
  invite: ClinicInvitation;
  locations: ClinicLocation[];
}) {
  const locationsById = new Map(locations.map((location) => [location.id, location.name]));
  const locationNames = invite.location_ids
    .map((id) => locationsById.get(id))
    .filter((name): name is string => Boolean(name));

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    title: {
      ...typography.body,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    meta: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
    },
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{invite.display_name?.trim() || invite.email}</Text>
      {invite.display_name?.trim() ? <Text style={styles.meta}>{invite.email}</Text> : null}
      <Text style={styles.meta}>
        {[invite.title?.trim() || 'Manager', locationNames.join(' · ') || 'Locations TBD']
          .filter(Boolean)
          .join(' · ')}
      </Text>
    </View>
  );
}

function ReviewSection({
  icon,
  label,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: ReactNode;
}) {
  const styles = useThemedStyles(({ spacing }) => ({
    section: { gap: spacing.sm },
  }));

  return (
    <View style={styles.section}>
      <FormSectionHeader icon={icon} label={label} />
      {children}
    </View>
  );
}

export default function ClinicReviewScreen() {
  const { user } = useAuth();
  const {
    clinicId,
    clinicProfile,
    isClinicProfileReady,
    refreshClinicProfile,
    isGroup,
    locations,
  } = useClinicProfile();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const setupFormProps = useSetupFormScreenProps('clinic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<ClinicInvitation[]>([]);
  const progress = useSetupStepProgress('review', { role: 'clinic' });
  const activeLocations = locations.filter((location) => location.is_active);

  useClinicSetupStepGuard('review', clinicProfile, isClinicProfileReady, isEditMode);

  const loadPendingInvites = useCallback(async () => {
    if (!isGroup || !clinicId) {
      setPendingInvites([]);
      return;
    }
    try {
      const invites = await listClinicInvitations(clinicId);
      setPendingInvites(invites.filter((invite) => invite.status === 'pending'));
    } catch {
      setPendingInvites([]);
    }
  }, [clinicId, isGroup]);

  useEffect(() => {
    void loadPendingInvites();
  }, [loadPendingInvites]);

  const missingFields = getMissingClinicProfileFields(clinicProfile, {
    locations: activeLocations,
  });

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    stack: { gap: spacing.lg },
    cardStack: { gap: spacing.sm },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    empty: {
      ...typography.subtitle,
      paddingVertical: spacing.sm,
    },
    mutedNote: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  const specialtyLabelValue =
    SPECIALTY_OPTIONS.find((item) => item.value === clinicProfile?.specialty)?.label ??
    'General dentistry';

  const handleFinish = async () => {
    if (!user?.id) {
      setSubmitError('You must be signed in to finish setup.');
      return;
    }

    const missing = getMissingClinicProfileFields(clinicProfile, {
      locations: activeLocations,
    });
    if (missing.length > 0) {
      setSubmitError(`Still needed: ${missing.join(', ')}`);
      return;
    }

    setSubmitError(null);
    setIsFinishing(true);
    setIsSubmitting(true);
    try {
      await completeClinicSetup(user.id);
      router.replace(CLINIC_HOME_WELCOME);
      void refreshClinicProfile();
    } catch (error) {
      setIsFinishing(false);
      setSubmitError(
        error instanceof Error ? error.message : 'Could not finish setup. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClinicProfileReady || !clinicProfile) return null;

  // Finishing stamps setup_completed_at, which would otherwise look like
  // edit-mode and bounce to Profile instead of the dashboard welcome.
  if (isEditMode && !isFinishing) {
    return <Redirect href={exitHref} />;
  }

  return (
    <FormScreen
      {...setupFormProps}
      title={isGroup ? 'Review your group' : 'Review your profile'}
      subtitle={
        isGroup
          ? 'Confirm your locations, team, and profile look right before going live.'
          : 'Confirm everything looks right before posting.'
      }
      onBack={() => router.back()}
      footer={
        <View style={styles.footer}>
          {submitError || missingFields.length > 0 ? (
            <FormErrorBanner
              message={
                submitError ??
                `Still needed: ${missingFields.join(', ')}. Go back to an earlier step to add them.`
              }
            />
          ) : null}
          <OnboardingButton
            label={isSubmitting ? 'Finishing…' : 'Finish setup'}
            disabled={isSubmitting || missingFields.length > 0}
            onPress={handleFinish}
          />
        </View>
      }>
      {progress.visible ? (
        <SetupStepProgress step={progress.step} total={progress.total} />
      ) : null}

      {isGroup ? (
        <View style={styles.stack}>
          <ReviewSection icon="business-outline" label="Group">
            <SurfaceCard padding="lg">
              <ReviewRow label="Group name" value={clinicProfile.clinic_name} />
              <ReviewRow label="Contact" value={clinicProfile.contact_name ?? ''} />
              <ReviewRow label="Phone" value={clinicProfile.phone ?? ''} isLast />
            </SurfaceCard>
          </ReviewSection>

          <ReviewSection icon="location-outline" label="Locations">
            <View style={styles.cardStack}>
              {activeLocations.length === 0 ? (
                <Text style={styles.empty}>No locations yet</Text>
              ) : (
                activeLocations.map((location) => (
                  <LocationReviewCard key={location.id} location={location} />
                ))
              )}
            </View>
          </ReviewSection>

          <ReviewSection icon="people-outline" label="Managers">
            <View style={styles.cardStack}>
              {pendingInvites.length === 0 ? (
                <SurfaceCard padding="lg">
                  <Text style={styles.mutedNote}>
                    No managers invited yet. You can invite your team from Profile later.
                  </Text>
                </SurfaceCard>
              ) : (
                pendingInvites.map((invite) => (
                  <ManagerReviewCard
                    key={invite.id}
                    invite={invite}
                    locations={activeLocations}
                  />
                ))
              )}
            </View>
          </ReviewSection>

          <ReviewSection icon="medkit-outline" label="Doctors">
            <SurfaceCard padding="lg">
              <PracticeDoctorReviewSection
                doctors={clinicProfile.practice_doctors ?? []}
                locations={activeLocations.map((location) => ({
                  id: location.id,
                  name: location.name,
                }))}
                showLabel={false}
              />
            </SurfaceCard>
          </ReviewSection>

          <ReviewSection icon="document-text-outline" label="About">
            <SurfaceCard padding="lg">
              <ReviewRow label="Description" value={clinicProfile.description ?? ''} isLast />
            </SurfaceCard>
          </ReviewSection>
        </View>
      ) : (
        <SurfaceCard padding="lg">
          <ReviewRow label="Clinic name" value={clinicProfile.clinic_name} />
          <ReviewRow label="Contact" value={clinicProfile.contact_name ?? ''} />
          <ReviewRow label="Phone" value={clinicProfile.phone ?? ''} />
          <ReviewRow
            label="Address"
            value={[clinicProfile.address_line1, clinicProfile.city, clinicProfile.postal_code]
              .filter(Boolean)
              .join(', ')}
          />
          <ReviewRow label="Specialty" value={specialtyLabelValue} />
          <ReviewRow
            label="Operatories"
            value={clinicProfile.operatories_count?.toString() ?? ''}
          />
          <ReviewRow
            label="Team size"
            value={getTeamSizeRangeLabel(clinicProfile.team_size_range) ?? ''}
          />
          <ReviewRow label="Software" value={clinicProfile.software_used.join(', ')} />
          <PracticeDoctorReviewSection
            doctors={clinicProfile.practice_doctors ?? []}
            locations={activeLocations.map((location) => ({
              id: location.id,
              name: location.name,
            }))}
          />
          <ReviewRow label="Description" value={clinicProfile.description ?? ''} isLast />
        </SurfaceCard>
      )}

      <SetupBillingUpsellLink
        label={
          isGroup
            ? 'Need more locations, managers, or hiring tools? View plans'
            : 'Want hiring tools on day one? View plans'
        }
        focus={isGroup ? 'group' : 'clinic'}
      />
    </FormScreen>
  );
}
