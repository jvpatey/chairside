import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  initialRouteName: 'index',
};

function SplashScreenController({ fontsReady }: { fontsReady: boolean }) {
  const { isHydrated } = useOnboarding();

  useEffect(() => {
    if (fontsReady && isHydrated) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady, isHydrated]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const fontsReady = fontsLoaded || !!fontError;

  if (!fontsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <SplashScreenController fontsReady={fontsReady} />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}
