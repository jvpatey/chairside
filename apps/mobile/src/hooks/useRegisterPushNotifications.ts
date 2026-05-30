import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { getPingramClientId } from '@/lib/pingram';
import { registerPingramPushNotifications } from '@/lib/pingramPushRegistration';
import { isNativePushAvailable } from '@/lib/pingramPush';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers the device push token with Pingram after onboarding.
 * Uses expo-notifications for APNs/FCM tokens (the NotificationAPI native module
 * expects an AppDelegate hook that Expo does not provide).
 */
export function useRegisterPushNotifications() {
  const { user, profile } = useAuth();
  const { workerProfile, isProfileComplete: workerComplete } = useWorkerProfile();
  const { clinicProfile, isProfileComplete: clinicComplete } = useClinicProfile();
  const registeredForUserRef = useRef<string | null>(null);
  const registerInFlightRef = useRef(false);

  const setupComplete =
    profile?.role === 'worker'
      ? Boolean(workerProfile?.setup_completed_at && workerComplete)
      : profile?.role === 'clinic'
        ? Boolean(clinicProfile?.setup_completed_at && clinicComplete)
        : false;

  const registerPush = useCallback(async () => {
    const clientId = getPingramClientId();
    const userId = user?.id;

    if (!clientId) {
      console.warn(
        'Push registration skipped: EXPO_PUBLIC_PINGRAM_CLIENT_ID is not set in this build.',
      );
      return;
    }

    if (!userId || !setupComplete) return;
    if (!isNativePushAvailable()) return;
    if (Platform.OS === 'web') return;
    if (registeredForUserRef.current === userId) return;
    if (registerInFlightRef.current) return;

    registerInFlightRef.current = true;

    try {
      const registered = await registerPingramPushNotifications(userId);
      if (registered) {
        registeredForUserRef.current = userId;
      }
    } catch (error) {
      console.warn('Push registration failed', error);
    } finally {
      registerInFlightRef.current = false;
    }
  }, [setupComplete, user?.id]);

  useEffect(() => {
    void registerPush();
  }, [registerPush]);

  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void registerPush();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [registerPush]);

  useEffect(() => {
    if (!user?.id) {
      registeredForUserRef.current = null;
    }
  }, [user?.id]);
}
