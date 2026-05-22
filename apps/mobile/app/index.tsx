import { Redirect } from 'expo-router';

import { useOnboarding } from '@/contexts/OnboardingContext';

export default function Index() {
  const { isHydrated, hasCompletedOnboarding } = useOnboarding();

  if (!isHydrated) {
    return null;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
