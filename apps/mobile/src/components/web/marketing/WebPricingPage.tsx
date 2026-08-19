import { Redirect } from 'expo-router';

import { WELCOME_ROUTE } from '@/lib/publicRoutes';

/** Native has no marketing pricing page — send people to welcome. */
export function WebPricingPage() {
  return <Redirect href={WELCOME_ROUTE} />;
}
