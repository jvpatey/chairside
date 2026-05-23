import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { getHomeRouteForRole } from '@/lib/routing';
import { useTheme } from '@/theme';

export default function Index() {
  const { colors } = useTheme();
  const { isHydrated } = useOnboarding();
  const { isAuthReady, session, profile } = useAuth();

  if (!isHydrated || !isAuthReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (!profile?.role) {
    return <Redirect href="/(onboarding)/role?fromAuth=1" />;
  }

  return <Redirect href={getHomeRouteForRole(profile.role)} />;
}
