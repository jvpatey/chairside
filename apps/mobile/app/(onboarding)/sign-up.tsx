import {
  establishSessionAfterSignUp,
  getAuthErrorMessage,
  getProfile,
  getSupabaseClient,
  setProfileRole,
  signInWithApple,
  signInWithGoogle,
  signUpWithEmail,
} from '@chairside/api';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { AUTH_STAGGER, enterFadeUp } from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SocialAuthButtons } from '@/components/onboarding/SocialAuthButtons';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormSuccessBanner } from '@/components/ui/FormSuccessBanner';
import { PasswordRequirements } from '@/components/onboarding/PasswordRequirements';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { saveClinicInviteToken } from '@/lib/clinicInviteSession';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import {
  evaluatePassword,
  getPasswordPlaceholder,
  getPasswordTooShortMessage,
  passwordsMatch,
} from '@/lib/passwordPolicy';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';
import type { UserRole } from '@/types';

function parseRole(value: string | string[] | undefined): UserRole | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'worker' || raw === 'clinic' ? raw : null;
}

export default function SignUpScreen() {
  const { role: roleParam, inviteToken } = useLocalSearchParams<{
    role?: string;
    inviteToken?: string;
  }>();
  const role = parseRole(roleParam);
  const pendingInviteToken = typeof inviteToken === 'string' ? inviteToken.trim() : '';
  const { refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const reducedMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const passwordEvaluation = evaluatePassword(password, { email });
  const confirmHasInput = confirmPassword.length > 0;
  const passwordsDoMatch = passwordsMatch(password, confirmPassword);
  const canSubmit =
    Boolean(email.trim()) && passwordEvaluation.isValid && passwordsDoMatch && confirmHasInput;

  useEffect(() => {
    if (pendingInviteToken) {
      void saveClinicInviteToken(pendingInviteToken);
    }
  }, [pendingInviteToken]);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: {
      gap: spacing.md,
    },
    matchHint: {
      fontSize: 13,
      lineHeight: 18,
      paddingHorizontal: spacing.xs,
    },
    matchHintSuccess: {
      color: colors.success,
      fontWeight: '500',
    },
    matchHintError: {
      color: colors.destructive,
      fontWeight: '500',
    },
    footer: {
      gap: spacing.md,
      marginTop: Platform.OS === 'web' ? 0 : spacing.lg,
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
    setFormSuccess(null);
    try {
      await action();
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const profile = session?.user ? await getProfile(session.user.id) : null;

      if (!session?.user) return;

      if (!profile?.role && role && profile?.id) {
        await setProfileRole(profile.id, role);
        await refreshProfile();
      }

      await handleAuthSuccess(refreshProfile, completeOnboarding, session.user.id);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message !== 'Sign in was cancelled.') {
        setFormError(message);
        setFormSuccess(null);
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
      setFormSuccess(null);
      if (Platform.OS !== 'web') {
        Alert.alert('Missing information', 'Fill in all fields to create your account.');
      }
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Make sure both password fields match.');
      setFormSuccess(null);
      if (Platform.OS !== 'web') {
        Alert.alert('Passwords do not match', 'Make sure both password fields match.');
      }
      return;
    }

    if (passwordEvaluation.maxLengthError) {
      setFormError(passwordEvaluation.maxLengthError);
      setFormSuccess(null);
      if (Platform.OS !== 'web') {
        Alert.alert('Password too long', passwordEvaluation.maxLengthError);
      }
      return;
    }

    if (!passwordEvaluation.isValid) {
      const message = passwordEvaluation.requirements.find((requirement) => !requirement.met)?.label
        ? `Password requirements not met: ${passwordEvaluation.requirements
            .filter((requirement) => !requirement.met)
            .map((requirement) => requirement.label.toLowerCase())
            .join(', ')}.`
        : getPasswordTooShortMessage();
      setFormError(message);
      setFormSuccess(null);
      if (Platform.OS !== 'web') {
        Alert.alert('Password requirements not met', message);
      }
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const signUpData = await signUpWithEmail(email, password, role);
      const session = await establishSessionAfterSignUp(email, password, signUpData);
      const user = signUpData.user ?? session?.user ?? null;

      if (session && user) {
        await handleAuthSuccess(refreshProfile, completeOnboarding, user.id);
        return;
      }

      if (user) {
        const message = 'We sent a confirmation link. Open it to finish setting up your account.';
        setFormSuccess(message);
        if (Platform.OS !== 'web') {
          Alert.alert('Confirm your email', message);
        }
        return;
      }
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      setFormSuccess(null);
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
      webLayout="centeredDecision"
      footer={
        <View style={styles.footer}>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.primaryCta, reducedMotion)}>
            <OnboardingButton
              label={isSubmitting ? 'Creating account…' : 'Create account'}
              disabled={isSubmitting || !canSubmit}
              onPress={handleCreateAccount}
            />
          </Animated.View>
          <View style={styles.switchRow}>
            <Text style={styles.switchMuted}>Already have an account?</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                router.replace(
                  pendingInviteToken
                    ? (`/(onboarding)/sign-in?inviteToken=${encodeURIComponent(pendingInviteToken)}` as const)
                    : '/(onboarding)/sign-in',
                )
              }
              style={({ pressed, hovered }) => [
                styles.switchLinkPressable,
                webHover(hovered, pressed, styles.switchLinkHovered),
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={styles.switchLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
        <AuthScreenHeader
          title={pendingInviteToken ? 'Create your clinic account' : 'Create your account'}
          subtitle={
            pendingInviteToken
              ? 'Use the email your invitation was sent to, then you’ll join the group.'
              : 'A few details to get you into Chairside.'
          }
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
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
        <FormErrorBanner message={formError} />
        <FormSuccessBanner message={formSuccess} />
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
          placeholder={getPasswordPlaceholder()}
          secureTextEntry
          enablePasswordVisibilityToggle
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
          validated={passwordEvaluation.isValid}
        />
        <PasswordRequirements password={password} email={email} evaluation={passwordEvaluation} />
        <AuthField
          label="Confirm password"
          placeholder="Confirm your password"
          secureTextEntry
          enablePasswordVisibilityToggle
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isSubmitting}
          validated={canSubmit}
          invalid={confirmHasInput && !passwordsDoMatch}
        />
        {confirmHasInput ? (
          <Text
            style={[
              styles.matchHint,
              passwordsDoMatch ? styles.matchHintSuccess : styles.matchHintError,
            ]}
          >
            {passwordsDoMatch ? 'Passwords match' : 'Passwords do not match'}
          </Text>
        ) : null}
      </Animated.View>
    </OnboardingShell>
  );
}
