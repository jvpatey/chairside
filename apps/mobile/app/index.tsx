import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/theme';

export default function Index() {
  const { colors } = useTheme();
  const { isHydrated, hasCompletedOnboarding } = useOnboarding();

  if (!isHydrated) {
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

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
