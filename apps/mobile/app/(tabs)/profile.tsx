import { router } from 'expo-router';
import { View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WorkerAccountSection } from '@/components/worker/WorkerAccountSection';
import { WorkerApplicationKitView } from '@/components/worker/WorkerApplicationKitView';
import { WorkerProfessionalView } from '@/components/worker/WorkerProfessionalView';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_SETUP_APPLICATION, WORKER_SETUP_BASICS } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerProfileScreen() {
  const { profile, user } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.xl },
    actions: { gap: spacing.sm },
  }));

  if (!isWorkerProfileReady) return null;

  return (
    <Screen title="Profile" subtitle="Your account, professional background, and application kit.">
      <View style={styles.content}>
        <WorkerAccountSection displayName={profile?.display_name} email={user?.email} />

        <WorkerProfessionalView profile={workerProfile} />
        <View style={styles.actions}>
          <OnboardingButton
            label={workerProfile ? 'Edit background' : 'Add background'}
            variant="secondary"
            onPress={() => router.push(WORKER_SETUP_BASICS)}
          />
        </View>

        <WorkerApplicationKitView profile={workerProfile} />
        <View style={styles.actions}>
          <OnboardingButton
            label="Edit application kit"
            variant="secondary"
            onPress={() => router.push(WORKER_SETUP_APPLICATION)}
          />
        </View>
      </View>
    </Screen>
  );
}
