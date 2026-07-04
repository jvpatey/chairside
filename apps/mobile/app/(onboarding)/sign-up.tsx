import {
  getAuthErrorMessage,
  getProfile,
  getSupabaseClient,
  setProfileRole,
  signInWithApple,
  signInWithGoogle,
  signUpWithEmail,
} from '@chairside/api';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  AUTH_STAGGER,
  enterFadeUp,
} from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { AuthHeroGlow } from '@/components/onboarding/AuthHeroGlow';
import { SocialAuthButtons } from '@/components/onboarding/SocialAuthButtons';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { getHomeRouteForRole } from '@/lib/routing';
import {
  webHover,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';
import type { UserRole } from '@/types';

function parseRole(value: string | string[] | undefined): UserRole | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'worker' || raw === 'clinic' ? raw : null;
}

export default function SignUpScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role = parseRole(roleParam);
  const { refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const reducedMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: {
      gap: spacing.md,
    },
    footer: {
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    switchMuted: {
      fontSize: 15,
      color: colors.labelSecondary,
    },
    switchLinkPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    switchLinkHovered: webTextLinkHoverStyles(colors),
    switchLink: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const runSocialSignIn = async (action: () => Promise<unknown>) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await action();
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const profile = session?.user ? await getProfile(session.user.id) : null;

      if (!profile?.role && role && profile?.id) {
        await setProfileRole(profile.id, role);
        await refreshProfile();
        await completeOnboarding(role);
        router.replace(getHomeRouteForRole(role));
        return;
      }

      if (!session?.user) return;

      await handleAuthSuccess(refreshProfile, completeOnboarding, session.user.id);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message !== 'Sign in was cancelled.') {
        setFormError(message);
        if (Platform.OS !== 'web') {
          Alert.alert('Sign up failed', message);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!role) {
      router.replace('/(onboarding)/role');
      return;
    }

    if (isSubmitting) return;

    if (!email.trim() || !password || !confirmPassword) {
      setFormError('Fill in all fields to create your account.');
      if (Platform.OS !== 'web') {
        Alert.alert('Missing information', 'Fill in all fields to create your account.');
      }
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Make sure both password fields match.');
      if (Platform.OS !== 'web') {
        Alert.alert('Passwords do not match', 'Make sure both password fields match.');
      }
      return;
    }

    if (password.length < 6) {
      setFormError('Use at least 6 characters.');
      if (Platform.OS !== 'web') {
        Alert.alert('Password too short', 'Use at least 6 characters.');
      }
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const { session, user } = await signUpWithEmail(email, password, role);

      if (!session) {
        const message =
          'We sent a confirmation link. Open it to finish setting up your account, then sign in.';
        setFormError(message);
        if (Platform.OS !== 'web') {
          Alert.alert('Confirm your email', message);
        }
        router.replace('/(onboarding)/sign-in');
        return;
      }

      if (user) {
        await handleAuthSuccess(refreshProfile, completeOnboarding, user.id);
      }
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Create account failed', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!role) {
    return <Redirect href="/(onboarding)/role" />;
  }

  return (
    <OnboardingShell
      authSplit
      backgroundAccessory={<AuthHeroGlow />}
      footer={
        <View style={styles.footer}>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.primaryCta, reducedMotion)}>
            <OnboardingButton
              label={isSubmitting ? 'Creating account…' : 'Create account'}
              disabled={isSubmitting}
              onPress={handleCreateAccount}
            />
          </Animated.View>
          <View style={styles.switchRow}>
            <Text style={styles.switchMuted}>Already have an account?</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/(onboarding)/sign-in')}
              style={({ pressed, hovered }) => [
                styles.switchLinkPressable,
                webHover(hovered, pressed, styles.switchLinkHovered),
                pressed && { opacity: 0.75 },
              ]}>
              <Text style={styles.switchLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      }>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
        <AuthScreenHeader
          title="Create your account"
          subtitle="A few details to get you into Chairside."
          onBack={() => router.back()}
        />
      </Animated.View>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.social, reducedMotion)}>
        <SocialAuthButtons
          disabled={isSubmitting}
          onApplePress={() => runSocialSignIn(signInWithApple)}
          onGooglePress={() => runSocialSignIn(signInWithGoogle)}
        />
      </Animated.View>
      <Animated.View
        entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)}
        style={styles.form}>
        <FormErrorBanner message={formError} />
        <AuthField
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!isSubmitting}
        />
        <AuthField
          label="Password"
          placeholder="Create a password"
          secureTextEntry
          enablePasswordVisibilityToggle
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
        />
        <AuthField
          label="Confirm password"
          placeholder="Confirm your password"
          secureTextEntry
          enablePasswordVisibilityToggle
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isSubmitting}
        />
      </Animated.View>
    </OnboardingShell>
  );
}
