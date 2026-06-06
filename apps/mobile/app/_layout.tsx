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

import { PushRegistration } from '@/components/notifications/PushRegistration';
import { ConfirmActionSheetHost } from '@/lib/confirmActionSheet';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ClinicProfileProvider } from '@/contexts/ClinicProfileContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ResumePreviewProvider } from '@/contexts/ResumePreviewContext';
import { WorkerProfileProvider } from '@/contexts/WorkerProfileContext';

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
  const { isAuthReady } = useAuth();

  useEffect(() => {
    if (fontsReady && isHydrated && isAuthReady) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady, isHydrated, isAuthReady]);

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
      <AuthProvider>
        <ClinicProfileProvider>
          <WorkerProfileProvider>
            <NotificationProvider>
              <ResumePreviewProvider>
                <OnboardingProvider>
                  <SplashScreenController fontsReady={fontsReady} />
                  <PushRegistration />
                  <ConfirmActionSheetHost />
                  <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                  <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(clinic-tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(clinic-setup)" options={{ headerShown: false }} />
                  <Stack.Screen name="(worker-setup)" options={{ headerShown: false }} />
                  <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
                  <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
                  </Stack>
                </OnboardingProvider>
              </ResumePreviewProvider>
            </NotificationProvider>
          </WorkerProfileProvider>
        </ClinicProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
