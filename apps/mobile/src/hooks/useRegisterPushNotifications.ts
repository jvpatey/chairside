import NotificationAPI from '@notificationapi/react-native';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { getPingramClientId } from '@/lib/pingram';

/**
 * Requests push permission after onboarding is complete (worker or clinic).
 * Requires a development build with FCM/APNs configured in Pingram.
 */
export function useRegisterPushNotifications() {
  const { user, profile } = useAuth();
  const { workerProfile, isProfileComplete: workerComplete } = useWorkerProfile();
  const { clinicProfile, isProfileComplete: clinicComplete } = useClinicProfile();
  const requestedRef = useRef(false);

  const setupComplete =
    profile?.role === 'worker'
      ? Boolean(workerProfile?.setup_completed_at && workerComplete)
      : profile?.role === 'clinic'
        ? Boolean(clinicProfile?.setup_completed_at && clinicComplete)
        : false;

  useEffect(() => {
    const clientId = getPingramClientId();
    const userId = user?.id;
    if (!clientId || !userId || !setupComplete || requestedRef.current) return;
    if (Platform.OS === 'web') return;

    requestedRef.current = true;

    void (async () => {
      try {
        if (!NotificationAPI.isReady) {
          await NotificationAPI.setup({
            clientId,
            userId,
            region: 'ca',
            autoRequestPermission: true,
          });
        } else {
          await NotificationAPI.requestPermission();
        }
      } catch (error) {
        console.warn('Push permission registration failed', error);
        requestedRef.current = false;
      }
    })();
  }, [user?.id, profile?.role, setupComplete, workerProfile?.setup_completed_at, clinicProfile?.setup_completed_at]);
}
