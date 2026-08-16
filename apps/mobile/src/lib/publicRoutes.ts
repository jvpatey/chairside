import { router } from 'expo-router';

export const WELCOME_ROUTE = '/(onboarding)/welcome' as const;
export const PRICING_ROUTE = '/pricing' as const;

export function navigateToWelcome() {
  router.push(WELCOME_ROUTE);
}

export function navigateToPricing() {
  router.push(PRICING_ROUTE);
}

export function navigateToWelcomeSection(sectionId: string) {
  if (typeof document !== 'undefined' && document.getElementById(sectionId)) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  router.push({
    pathname: WELCOME_ROUTE,
    params: { section: sectionId },
  });
}
