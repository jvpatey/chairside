import {
  createClinicLocation,
  getAuthErrorMessage,
  listClinicLocations,
  type ClinicLocation,
} from '@chairside/api';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import {
  AddressAutocomplete,
  createEmptyAddressValue,
  type AddressFormValue,
} from '@/components/clinic/AddressAutocomplete';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { AUTH_STAGGER, enterFadeUp } from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { AnalyticsEvents } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
import {
  clearClinicPostAuthCaptureSkip,
  markClinicPostAuthCaptureSkipped,
} from '@/lib/clinicPostAuthCapture';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { validateAddressStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

function profileToAddress(
  profile: NonNullable<ReturnType<typeof useClinicProfile>['clinicProfile']>,
): AddressFormValue {
  const address_line1 = profile.address_line1 ?? '';
  const city = profile.city ?? '';
  const postal_code = profile.postal_code ?? '';
  const hasCoordinates = profile.latitude != null && profile.longitude != null;
  const cityLine = [profile.city, profile.province, profile.postal_code].filter(Boolean).join(', ');
  const formatted =
    hasCoordinates && address_line1 ? [address_line1, cityLine].filter(Boolean).join(', ') : '';

  return {
    address_line1,
    address_line2: profile.address_line2 ?? '',
    city,
    province: profile.province ?? 'NS',
    postal_code,
    latitude: profile.latitude,
    longitude: profile.longitude,
    formatted,
  };
}

/**
 * Signup address step.
 * - Single clinic: one address, saved on the practice profile (the DB mirrors it to the
 *   clinic's only location).
 * - Group: each clinic is a named location (name + address) under the group name entered on
 *   the previous screen. The group name is never reused as a location name.
 */
export default function CaptureClinicAddressScreen() {
  const { user, profile, refreshProfile, isAuthReady } = useAuth();
  const { clinicId, clinicProfile, isGroup, refreshClinicProfile } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { completeOnboarding } = useOnboarding();
  const { upgradePrompt, handleBillingError } = useClinicUpgradePrompt();
  const reducedMotion = useReducedMotion();
  const [address, setAddress] = useState<AddressFormValue>(() =>
    clinicProfile && !isGroup ? profileToAddress(clinicProfile) : createEmptyAddressValue(),
  );
  const [clinicName, setClinicName] = useState('');
  const [savedClinics, setSavedClinics] = useState<ClinicLocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Seed the single-clinic form from the profile once; later refreshes must not overwrite it.
  const seededRef = useRef(Boolean(clinicProfile));

  const orgId = clinicId ?? user?.id ?? null;
  const accountTypeProp = { account_type: isGroup ? 'group' : 'individual' };
  const validation = validateAddressStep(address);
  const entryName = clinicName.trim();
  const entryHasAny = Boolean(
    entryName || address.address_line1.trim() || address.city.trim() || address.postal_code.trim(),
  );
  const entryComplete = Boolean(entryName) && validation.ok;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    form: { gap: spacing.md },
    footer: { gap: spacing.sm },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
      textAlign: 'center' as const,
      paddingTop: spacing.sm,
    },
    savedList: { gap: spacing.xs },
    savedHeading: { ...typography.body, fontWeight: '600' as const },
    savedItem: typography.subtitle,
  }));

  useEffect(() => {
    if (!clinicProfile || seededRef.current || isGroup) return;
    seededRef.current = true;
    setAddress(profileToAddress(clinicProfile));
  }, [clinicProfile, isGroup]);

  const loadSavedClinics = useCallback(async () => {
    if (!orgId) return;
    const rows = await listClinicLocations(orgId, { activeOnly: true });
    setSavedClinics(rows.filter((row) => Boolean(row.address_line1?.trim())));
  }, [orgId]);

  useEffect(() => {
    if (isGroup) void loadSavedClinics();
  }, [isGroup, loadSavedClinics]);

  if (isAuthReady && !user) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (isAuthReady && profile?.role && profile.role !== 'clinic') {
    return <Redirect href="/(onboarding)/role" />;
  }

  const addressPayload = () => ({
    address_line1: address.address_line1.trim(),
    address_line2: address.address_line2.trim() || null,
    city: address.city.trim(),
    province: address.province.trim() || 'NS',
    postal_code: address.postal_code.trim(),
    latitude: address.latitude,
    longitude: address.longitude,
  });

  const continueAfter = async () => {
    await refreshClinicProfile();
    await refreshProfile(user!.id);
    await handleAuthSuccess(refreshProfile, completeOnboarding, user!.id);
  };

  /** Group: saves the entry as a clinic. Returns false when it is incomplete. */
  const saveGroupEntry = async (): Promise<boolean> => {
    if (!entryHasAny) return true;
    if (!entryComplete || !orgId) {
      setFormError(entryName ? validation.message : 'Name this clinic to continue.');
      return false;
    }
    await createClinicLocation(orgId, {
      name: entryName,
      ...addressPayload(),
    });
    setClinicName('');
    setAddress(createEmptyAddressValue());
    await loadSavedClinics();
    captureAnalyticsEvent(AnalyticsEvents.clinicSignupLocationAdded);
    return true;
  };

  const handleAddAnother = async () => {
    if (!user?.id || isSubmitting) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      if (!entryHasAny) {
        setFormError('Enter the next clinic first.');
        return;
      }
      const saved = await saveGroupEntry();
      if (saved) captureAnalyticsEvent(AnalyticsEvents.clinicSignupAddAnotherTapped);
    } catch (error) {
      if (handleBillingError(error)) {
        captureAnalyticsEvent(AnalyticsEvents.clinicSignupLocationLimitHit);
        return;
      }
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (!user?.id || isSubmitting) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      if (isGroup) {
        if (savedClinics.length === 0 && !entryComplete) {
          setFormError(entryName ? validation.message : 'Name your first clinic to continue.');
          return;
        }
        const saved = await saveGroupEntry();
        if (!saved) return;
      } else {
        if (!validation.ok) {
          setFormError(validation.message);
          return;
        }
        await save({
          ...addressPayload(),
          account_type: clinicProfile?.account_type ?? 'individual',
        });
      }
      await clearClinicPostAuthCaptureSkip(user.id, 'address');
      captureAnalyticsEvent(AnalyticsEvents.clinicSignupAddressSaved, accountTypeProp);
      await continueAfter();
    } catch (error) {
      if (handleBillingError(error)) {
        captureAnalyticsEvent(AnalyticsEvents.clinicSignupLocationLimitHit);
        return;
      }
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not save', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!user?.id || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Groups with at least one saved clinic are done; otherwise posting will ask again.
      if (!isGroup || savedClinics.length === 0) {
        await markClinicPostAuthCaptureSkipped(user.id, 'address');
        captureAnalyticsEvent(AnalyticsEvents.clinicSignupAddressSkipped, accountTypeProp);
      }
      await continueAfter();
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueDisabled = isGroup
    ? isSubmitting || (entryHasAny ? !entryComplete : savedClinics.length === 0)
    : isSubmitting || !validation.ok;

  const footnote = isGroup
    ? 'Free includes up to 2 clinics. Need more? You’ll see plan options and keep what you’ve added.'
    : 'You can add more clinics later in Settings → Clinics.';

  return (
    <>
      {upgradePrompt}
      <OnboardingShell
        webLayout="centeredDecision"
        footer={
          <View style={styles.footer}>
            <OnboardingButton
              label={isSubmitting ? 'Saving…' : isGroup && entryHasAny ? 'Save and continue' : 'Continue'}
              disabled={continueDisabled}
              onPress={() => void handleContinue()}
            />
            {isGroup ? (
              <OnboardingButton
                label="Save and add another clinic"
                variant="ghost"
                disabled={isSubmitting || !entryComplete}
                onPress={() => void handleAddAnother()}
              />
            ) : null}
            <OnboardingButton
              label="Skip for now"
              variant="ghost"
              disabled={isSubmitting}
              onPress={() => void handleSkip()}
            />
            <Text style={styles.footnote}>{footnote}</Text>
          </View>
        }>
        <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
          <AuthScreenHeader
            title={isGroup ? 'Add your clinics' : 'Clinic address'}
            subtitle={
              isGroup
                ? 'Name each clinic and add its address.'
                : 'Your practice location — shown on fill-ins and used for nearby matching.'
            }
            onBack={() => router.back()}
          />
        </Animated.View>
        <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
          <FormErrorBanner message={formError} />
          {isGroup && savedClinics.length > 0 ? (
            <View style={styles.savedList}>
              <Text style={styles.savedHeading}>Saved clinics</Text>
              {savedClinics.map((clinic) => (
                <Text key={clinic.id} style={styles.savedItem}>
                  {clinic.name}
                  {clinic.city ? ` · ${clinic.city}` : ''}
                </Text>
              ))}
            </View>
          ) : null}
          {isGroup ? (
            <AuthField
              label="Clinic name"
              placeholder="Downtown"
              value={clinicName}
              onChangeText={setClinicName}
              autoCapitalize="words"
              icon="business-outline"
              editable={!isSubmitting}
              required
              validated={Boolean(clinicName.trim())}
            />
          ) : null}
          <AddressAutocomplete value={address} onChange={setAddress} required />
        </Animated.View>
      </OnboardingShell>
    </>
  );
}
