import { useRegisterPushNotifications } from '@/hooks/useRegisterPushNotifications';

/** Mount inside authenticated app tree to request push after onboarding. */
export function PushRegistration() {
  useRegisterPushNotifications();
  return null;
}
