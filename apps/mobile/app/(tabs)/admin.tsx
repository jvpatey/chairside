import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { getHomeRouteForRole } from '@/lib/routing';

/** Native builds do not expose the internal admin dashboard. */
export default function WorkerAdminScreenNative() {
  const { profile } = useAuth();
  const href = profile?.role ? getHomeRouteForRole(profile.role) : '/(onboarding)/welcome';
  return <Redirect href={href} />;
}
