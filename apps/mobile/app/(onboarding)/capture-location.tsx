import { getAuthErrorMessage, getWorkerRoleTypes } from '@chairside/api';
import { ROLE_TYPE_OPTIONS, type RoleType } from '@chairside/config';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { AUTH_STAGGER, enterFadeUp } from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import {
  clearWorkerPostAuthCaptureSkip,
  markWorkerPostAuthCaptureSkipped,
} from '@/lib/workerPostAuthCapture';
import { useThemedStyles } from '@/theme';

const PROVINCE_OPTIONS = [
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
] as const;

type ProvinceCode = (typeof PROVINCE_OPTIONS)[number]['value'];

export default function CaptureLocationScreen() {
  const { user, profile, refreshProfile, isAuthReady } = useAuth();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { completeOnboarding } = useOnboarding();
  const reducedMotion = useReducedMotion();
  const [roleTypes, setRoleTypes] = useState<RoleType[]>(() => getWorkerRoleTypes(workerProfile));
  const [city, setCity] = useState(workerProfile?.city?.trim() ?? '');
  const [province, setProvince] = useState<ProvinceCode>(
    (workerProfile?.province as ProvinceCode | undefined) ?? 'NS',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canContinue = roleTypes.length > 0 && Boolean(city.trim());

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: {
      gap: spacing.md,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
    footer: {
      gap: spacing.sm,
    },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
    },
  }));

  useEffect(() => {
    setRoleTypes(getWorkerRoleTypes(workerProfile));
    if (workerProfile?.city) setCity(workerProfile.city.trim());
    if (workerProfile?.province) {
      setProvince(workerProfile.province as ProvinceCode);
    }
  }, [workerProfile]);

  if (isAuthReady && !user) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (isAuthReady && profile?.role && profile.role !== 'worker') {
    return <Redirect href="/(onboarding)/role" />;
  }

  const continueAfter = async () => {
    await refreshProfile(user!.id);
    await refreshWorkerProfile();
    await handleAuthSuccess(refreshProfile, completeOnboarding, user!.id);
  };

  const handleContinue = async () => {
    if (!user?.id || isSubmitting) return;
    if (roleTypes.length === 0) {
      setFormError('Pick at least one role so we can match the right openings.');
      return;
    }
    if (!city.trim()) {
      setFormError('Add your city so we can show nearby openings.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await save({
        role_types: roleTypes,
        city: city.trim(),
        province,
      });
      await clearWorkerPostAuthCaptureSkip(user.id, 'location');
      await continueAfter();
    } catch (error) {
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
    setFormError(null);
    try {
      await markWorkerPostAuthCaptureSkipped(user.id, 'location');
      await continueAfter();
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      webLayout="centeredDecision"
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={isSubmitting || !canContinue}
            onPress={() => void handleContinue()}
          />
          <OnboardingButton
            label="Skip for now"
            variant="ghost"
            disabled={isSubmitting}
            onPress={() => void handleSkip()}
          />
          <Text style={styles.footnote}>You can update this anytime in Profile.</Text>
        </View>
      }>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
        <AuthScreenHeader
          title="Your role and area"
          subtitle="Tell us what you do and where you’re based so we show matching jobs and fill-ins."
          onBack={() => router.back()}
        />
      </Animated.View>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
        <FormErrorBanner message={formError} />
        <Text style={styles.sectionLabel}>Role</Text>
        <ChipSelector
          options={[...ROLE_TYPE_OPTIONS]}
          selected={roleTypes}
          multiple
          onChange={(value) => setRoleTypes(value as RoleType[])}
          accent="secondary"
        />
        <Text style={styles.sectionLabel}>Area</Text>
        <AuthField
          label="City"
          placeholder="City"
          autoCapitalize="words"
          value={city}
          onChangeText={setCity}
          editable={!isSubmitting}
        />
        <ChipSelector
          options={[...PROVINCE_OPTIONS]}
          selected={province}
          multiple={false}
          onChange={(value) => setProvince(value as ProvinceCode)}
          accent="secondary"
        />
      </Animated.View>
    </OnboardingShell>
  );
}
