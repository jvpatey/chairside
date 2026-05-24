import NotificationAPI from '@notificationapi/react-native';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { getPingramClientId } from '@/lib/pingram';
import { isNativePushAvailable } from '@/lib/pingramPush';

/**
 * Registers the device with Pingram for iOS/Android push after onboarding.
 * Requires an EAS build (not Expo Go) and APNs credentials in the Pingram dashboard.
 */
export function useRegisterPushNotifications() {
  const { user, profile } = useAuth();
  const { workerProfile, isProfileComplete: workerComplete } = useWorkerProfile();
  const { clinicProfile, isProfileComplete: clinicComplete } = useClinicProfile();
  const requestedForUserRef = useRef<string | null>(null);

  const setupComplete =
    profile?.role === 'worker'
      ? Boolean(workerProfile?.setup_completed_at && workerComplete)
      : profile?.role === 'clinic'
        ? Boolean(clinicProfile?.setup_completed_at && clinicComplete)
        : false;

  useEffect(() => {
    const clientId = getPingramClientId();
    const userId = user?.id;

    if (!clientId || !userId || !setupComplete) return;
    if (!isNativePushAvailable()) return;
    if (Platform.OS === 'web') return;
    if (requestedForUserRef.current === userId) return;

    let cancelled = false;

    void (async () => {
      try {
        await NotificationAPI.setup({
          clientId,
          userId,
          region: 'ca',
          autoRequestPermission: true,
        });
        if (!cancelled) {
          requestedForUserRef.current = userId;
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Push permission registration failed', error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    profile?.role,
    setupComplete,
    workerProfile?.setup_completed_at,
    clinicProfile?.setup_completed_at,
  ]);

  useEffect(() => {
    if (!user?.id) {
      requestedForUserRef.current = null;
    }
  }, [user?.id]);
}
