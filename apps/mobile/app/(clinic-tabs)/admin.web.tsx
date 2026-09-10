import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { isPlatformAdminEmail } from '@/lib/platformAdmin';
import { getHomeRouteForRole } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

/** Web-only stats dashboard nested in clinic tabs so the sidebar stays visible. */
export default function ClinicAdminScreen() {
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

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'Chairside Statistics';
    }
  }, []);

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

  if (!isPlatformAdminEmail(session.user?.email)) {
    const home = profile?.role ? getHomeRouteForRole(profile.role) : '/(onboarding)/welcome';
    return <Redirect href={home} />;
  }

  return <AdminDashboard />;
}
