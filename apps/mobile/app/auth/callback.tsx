import { hasAuthCallbackParams, isAuthCallbackPath } from '@chairside/api';
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

export default function AuthCallbackScreen() {
  const { refreshProfile, markPasswordRecoveryPending } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [isClientReady, setIsClientReady] = useState(Platform.OS !== 'web');
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
    if (!isClientReady) return;

    if (Platform.OS === 'web' && hasWebAuthLinkBeenHandled()) {
      return;
    }

    let cancelled = false;

    async function handleCallback() {
      const url =
        Platform.OS === 'web' ? resolveWebCallbackUrl() : await resolveNativeCallbackUrl();

      if (!url || cancelled) return;

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
  }, [completeOnboarding, isClientReady, markPasswordRecoveryPending, refreshProfile]);

  return (
    <OnboardingShell webLayout="centeredDecision" atmosphere="form">
      <AuthScreenHeader
        title="Opening your link"
        subtitle="This only takes a moment. We’ll put you in the right place."
      />
      <View
        style={styles.body}
        accessibilityRole="progressbar"
        accessibilityLabel="Opening secure link"
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
        <Text style={styles.message}>Opening secure link…</Text>
      </View>
    </OnboardingShell>
  );
}
