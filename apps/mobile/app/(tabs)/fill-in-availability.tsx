import { router } from 'expo-router';
import { View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FillInAvailabilityManageView } from '@/components/worker/FillInAvailabilityManageView';
import { WORKER_FILLINS } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function FillInAvailabilityScreen() {
  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
  }));

  return (
    <OnboardingShell atmosphere="subtle" atmosphereAccent="secondary">
      <AuthScreenHeader
        title="Fill-in availability"
        subtitle="Alerts, outreach, and your available days."
        onBack={() => router.replace(WORKER_FILLINS)}
      />
      <View style={styles.content}>
        <FillInAvailabilityManageView />
      </View>
    </OnboardingShell>
  );
}
