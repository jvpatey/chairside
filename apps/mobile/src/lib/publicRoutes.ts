import { router } from 'expo-router';

export const WELCOME_ROUTE = '/(onboarding)/welcome' as const;

export function navigateToWelcome() {
  router.push(WELCOME_ROUTE);
}
