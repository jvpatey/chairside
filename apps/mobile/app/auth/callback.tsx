import {
  consumeNativeOAuthCallbackHandled,
  hasAuthCallbackParams,
  isAuthCallbackPath,
  isAuthEmailLink,
  isPasswordRecoveryUrl,
} from '@chairside/api';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Animated, Platform, Text, View } from 'react-native';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { usePulseOpacity } from '@/lib/motion';
import { processAuthCallbackLink } from '@/lib/processAuthCallbackLink';
import { hasWebAuthLinkBeenHandled } from '@/lib/webAuthCallbackGate';
import { useThemedStyles } from '@/theme';

function resolveWebCallbackUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const href = window.location.href;
  if (isAuthCallbackPath(window.location.pathname) || hasAuthCallbackParams(href)) {
    return href;
  }

  return null;
}

async function resolveNativeCallbackUrl() {
  const initialUrl = await Linking.getInitialURL();
  if (initialUrl?.includes('auth/callback')) {
    return initialUrl;
  }

  return new Promise<string | null>((resolve) => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('auth/callback')) {
        subscription.remove();
        resolve(url);
      }
    });

    setTimeout(() => {
      subscription.remove();
      resolve(null);
    }, 5000);
  });
}

function isEmailOrRecoveryLink(url: string | null): boolean {
  if (!url) return false;
  return isAuthEmailLink(url) || isPasswordRecoveryUrl(url);
}

export default function AuthCallbackScreen() {
  const { refreshProfile, markPasswordRecoveryPending } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [isClientReady, setIsClientReady] = useState(Platform.OS !== 'web');
  const [callbackUrl, setCallbackUrl] = useState<string | null>(
    Platform.OS === 'web' ? resolveWebCallbackUrl() : null,
  );
  const [skipNativePaint, setSkipNativePaint] = useState(
    () => Platform.OS !== 'web' && consumeNativeOAuthCallbackHandled(),
  );
  const pulse = usePulseOpacity();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    body: {
      alignItems: 'center' as const,
      gap: spacing.lg,
      paddingVertical: spacing.xl,
    },
    message: {
      ...typography.subtitle,
      textAlign: 'center' as const,
    },
    dots: {
      flexDirection: 'row' as const,
      gap: spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
  }));

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsClientReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isClientReady || skipNativePaint) return;

    if (Platform.OS === 'web' && hasWebAuthLinkBeenHandled()) {
      return;
    }

    let cancelled = false;

    async function handleCallback() {
      // Re-check after awaiting the URL — native Google may have marked the gate
      // while we were waiting on the deep-link listener.
      if (Platform.OS !== 'web' && consumeNativeOAuthCallbackHandled()) {
        setSkipNativePaint(true);
        return;
      }

      const url =
        Platform.OS === 'web' ? resolveWebCallbackUrl() : await resolveNativeCallbackUrl();

      if (!url || cancelled) return;

      if (Platform.OS !== 'web' && consumeNativeOAuthCallbackHandled()) {
        setSkipNativePaint(true);
        return;
      }

      setCallbackUrl(url);

      await processAuthCallbackLink(url, {
        refreshProfile,
        completeOnboarding,
        markRecoveryInContext: markPasswordRecoveryPending,
      });
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [completeOnboarding, isClientReady, markPasswordRecoveryPending, refreshProfile, skipNativePaint]);

  if (skipNativePaint) {
    return null;
  }

  const showEmailLinkCopy = isEmailOrRecoveryLink(callbackUrl);
  // Until the URL is known, prefer OAuth copy so Google/Apple do not flash
  // "Opening your link". Email links set callbackUrl quickly and swap copy.
  const title = showEmailLinkCopy ? 'Opening your link' : 'Signing you in';
  const subtitle = showEmailLinkCopy
    ? 'This only takes a moment. We’ll put you in the right place.'
    : 'Just a moment…';
  const statusMessage = showEmailLinkCopy ? 'Opening secure link…' : 'Signing you in…';
  const accessibilityLabel = showEmailLinkCopy ? 'Opening secure link' : 'Signing you in';

  return (
    <OnboardingShell webLayout="centeredDecision" atmosphere="form">
      <AuthScreenHeader title={title} subtitle={subtitle} />
      <View
        style={styles.body}
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel}
      >
        <Animated.View style={{ opacity: pulse }}>
          <ChairsideWordmark variant="compact" />
        </Animated.View>
        <View style={styles.dots}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: pulse.interpolate({
                    inputRange: [0.45, 1],
                    outputRange: [0.35 + index * 0.15, 1 - index * 0.1],
                  }),
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.message}>{statusMessage}</Text>
      </View>
    </OnboardingShell>
  );
}
