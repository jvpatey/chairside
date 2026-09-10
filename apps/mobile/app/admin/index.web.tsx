import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { isPlatformAdminEmail } from '@/lib/platformAdmin';
import { getAdminRouteForRole, getHomeRouteForRole } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

/**
 * Deep-link entry for /admin — sends allowlisted users into the in-shell admin
 * route so the sidebar stays mounted.
 */
export default function AdminRedirectScreen() {
  const { session, profile, isAuthReady } = useAuth();
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors }) => ({
    boot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundGrouped,
    },
  }));

  if (!isAuthReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(onboarding)/sign-in" />;
  }

  if (!isPlatformAdminEmail(session.user?.email) || !profile?.role) {
    const home = profile?.role ? getHomeRouteForRole(profile.role) : '/(onboarding)/welcome';
    return <Redirect href={home} />;
  }

  return <Redirect href={getAdminRouteForRole(profile.role)} />;
}
