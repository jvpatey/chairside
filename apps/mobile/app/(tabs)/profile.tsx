import { router } from 'expo-router';
import { View } from 'react-native';

import { WorkerProfileView } from '@/components/worker/WorkerProfileView';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_SETUP_BASICS } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerProfileScreen() {
  const { profile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
  }));

  if (!isWorkerProfileReady) return null;

  return (
    <Screen title="Profile" subtitle="Your professional profile and availability.">
      <View style={styles.content}>
        <WorkerProfileView profile={workerProfile} displayName={profile?.display_name} />
        <OnboardingButton
          label={workerProfile ? 'Edit profile' : 'Set up profile'}
          variant="secondary"
          onPress={() => router.push(WORKER_SETUP_BASICS)}
        />
      </View>
    </Screen>
  );
}
