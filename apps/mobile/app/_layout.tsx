import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getColors } from '@/theme/colors';
import { getAppNavigationTheme } from '@/theme/navigationTheme';

import { PushRegistration } from '@/components/notifications/PushRegistration';
import { VercelAnalytics } from '@/components/analytics/VercelAnalytics';
import { ConfirmActionSheetHost } from '@/lib/confirmActionSheet';
import { GetStartedBrowseProgressProvider } from '@/contexts/GetStartedBrowseProgressContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClinicBillingProvider } from '@/contexts/ClinicBillingContext';
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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  const rootBackground = getColors(colorScheme).backgroundGrouped;
  const navigationTheme = getAppNavigationTheme(colorScheme);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: rootBackground }}>
      <View style={{ flex: 1, backgroundColor: rootBackground }}>
      <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <GetStartedBrowseProgressProvider>
        <ClinicProfileProvider>
          <ClinicBillingProvider>
          <WorkerProfileProvider>
            <NotificationProvider>
              <ResumePreviewProvider>
                <OnboardingProvider>
                  <PushRegistration />
                  <ConfirmActionSheetHost />
                  <VercelAnalytics />
                  <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                  <Stack
                    screenOptions={{
                      contentStyle: { backgroundColor: rootBackground },
                    }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(clinic-tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(clinic-setup)" options={{ headerShown: false }} />
                  <Stack.Screen name="(worker-setup)" options={{ headerShown: false }} />
                  <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
                  <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
                  <Stack.Screen name="privacy" options={{ headerShown: false }} />
                  <Stack.Screen name="support" options={{ headerShown: false }} />
                  <Stack.Screen name="terms" options={{ headerShown: false }} />
                  </Stack>
                </OnboardingProvider>
              </ResumePreviewProvider>
            </NotificationProvider>
          </WorkerProfileProvider>
          </ClinicBillingProvider>
        </ClinicProfileProvider>
        </GetStartedBrowseProgressProvider>
      </AuthProvider>
      </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}
