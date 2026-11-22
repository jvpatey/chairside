import { getAuthErrorMessage, updateProfileName } from '@chairside/api';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { AUTH_STAGGER, enterFadeUp } from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { useThemedStyles } from '@/theme';

export default function CaptureNameScreen() {
  const { user, profile, refreshProfile, isAuthReady } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const reducedMotion = useReducedMotion();
  const [firstName, setFirstName] = useState(profile?.first_name?.trim() ?? '');
  const [lastName, setLastName] = useState(profile?.last_name?.trim() ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const styles = useThemedStyles(({ spacing }) => ({
    form: {
      gap: spacing.md,
    },
  }));

  if (isAuthReady && !user) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  const handleContinue = async () => {
    if (!user?.id || isSubmitting) return;
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Add your first and last name to continue.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await updateProfileName(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      await refreshProfile(user.id);
      await handleAuthSuccess(refreshProfile, completeOnboarding, user.id);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not save name', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      webLayout="centeredDecision"
      footer={
        <OnboardingButton
          label={isSubmitting ? 'Saving…' : 'Continue'}
          disabled={isSubmitting || !firstName.trim() || !lastName.trim()}
          onPress={() => void handleContinue()}
        />
      }>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
        <AuthScreenHeader
          title="What’s your name?"
          subtitle="Add your name so clinics know who you are."
          onBack={() => router.back()}
        />
      </Animated.View>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
        <FormErrorBanner message={formError} />
        <AuthField
          label="First name"
          placeholder="First name"
          autoCapitalize="words"
          autoComplete="given-name"
          value={firstName}
          onChangeText={setFirstName}
          editable={!isSubmitting}
        />
        <AuthField
          label="Last name"
          placeholder="Last name"
          autoCapitalize="words"
          autoComplete="family-name"
          value={lastName}
          onChangeText={setLastName}
          editable={!isSubmitting}
        />
      </Animated.View>
    </OnboardingShell>
  );
}
