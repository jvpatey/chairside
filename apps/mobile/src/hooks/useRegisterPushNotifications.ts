import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { getPingramClientId, resolveNotificationDeepLink } from '@/lib/pingram';
import { registerPingramPushNotifications } from '@/lib/pingramPushRegistration';
import { isNativePushAvailable } from '@/lib/pingramPush';

function getPushSenderId(data: Record<string, unknown> | undefined): string | null {
  const senderId = data?.senderId;
  return typeof senderId === 'string' && senderId.trim() ? senderId.trim().toLowerCase() : null;
}

function getPushDeepLink(data: Record<string, unknown> | undefined): string | null {
  for (const key of ['url', 'deepLink', 'redirectURL']) {
    const value = data?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function getNotificationResponseKey(response: Notifications.NotificationResponse): string {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  const url = getPushDeepLink(data);
  if (url) return url;
  return `${response.notification.request.identifier}:${response.actionIdentifier}`;
}

/**
 * Registers the device push token with Pingram after onboarding.
 * Uses expo-notifications for APNs/FCM tokens (the NotificationAPI native module
 * expects an AppDelegate hook that Expo does not provide).
 */
export function useRegisterPushNotifications() {
  const { user, profile, isAuthReady } = useAuth();
  const { markReadByDeepLink } = useNotifications();
  const { workerProfile, isProfileComplete: workerComplete } = useWorkerProfile();
  const { clinicProfile, isProfileComplete: clinicComplete } = useClinicProfile();
  const registeredForUserRef = useRef<string | null>(null);
  const registerInFlightRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const handledResponseKeyRef = useRef<string | null>(null);
  const pendingRouteRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  const setupComplete =
    profile?.role === 'worker'
      ? Boolean(workerProfile?.setup_completed_at && workerComplete)
      : profile?.role === 'clinic'
        ? Boolean(clinicProfile?.setup_completed_at && clinicComplete)
        : false;

  const canNavigate = isAuthReady && Boolean(user?.id) && setupComplete;

  const navigateToPushTarget = useCallback((path: string) => {
    router.push(path as never);
  }, []);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse | null | undefined) => {
      if (!response) return;
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

      const responseKey = getNotificationResponseKey(response);
      if (handledResponseKeyRef.current === responseKey) return;
      handledResponseKeyRef.current = responseKey;

      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const path = resolveNotificationDeepLink(getPushDeepLink(data));
      if (!path) return;

      void markReadByDeepLink(path);

      if (!canNavigate) {
        pendingRouteRef.current = path;
        return;
      }

      navigateToPushTarget(path);
    },
    [canNavigate, markReadByDeepLink, navigateToPushTarget],
  );

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const senderId = getPushSenderId(
          notification.request.content.data as Record<string, unknown> | undefined,
        );
        const currentUserId = userIdRef.current?.toLowerCase() ?? null;

        if (senderId && currentUserId && senderId === currentUserId) {
          return {
            shouldShowBanner: false,
            shouldShowList: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }

        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });
  }, []);

  useEffect(() => {
    if (!canNavigate || !pendingRouteRef.current) return;

    const path = pendingRouteRef.current;
    pendingRouteRef.current = null;
    navigateToPushTarget(path);
  }, [canNavigate, navigateToPushTarget]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    void Notifications.getLastNotificationResponseAsync().then(handleNotificationResponse);

    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();
  }, [handleNotificationResponse]);

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
      pendingRouteRef.current = null;
      handledResponseKeyRef.current = null;
    }
  }, [user?.id]);
}
