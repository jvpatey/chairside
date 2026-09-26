import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormScreen } from '@/components/ui/FormScreen';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { FillInSmsPreview } from '@/components/worker/FillInSmsPreview';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useFillInAvailabilityToggle } from '@/hooks/useFillInAvailabilityToggle';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
import { useWorkerSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { WORKER_FILLIN_AVAILABILITY, WORKER_SETUP_REVIEW } from '@/lib/routing';
import { radii, useTheme, useThemedStyles } from '@/theme';

type Benefit = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
};

const BENEFITS: Benefit[] = [
  {
    icon: 'flash-outline',
    title: 'Hear first',
    body: 'Alerts go out the moment a clinic near you posts a fill-in.',
  },
  {
    icon: 'cash-outline',
    title: 'Pick up extra shifts',
    body: 'Cover short-notice days that fit around your schedule.',
  },
  {
    icon: 'calendar-outline',
    title: 'You stay in control',
    body: 'Limit alerts to your available days, or turn them off anytime.',
  },
];

export default function WorkerFillInsSetupScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { isEditMode } = useSetupEditMode({ role: 'worker' });
  const setupFormProps = useSetupFormScreenProps('worker');
  const progress = useSetupStepProgress('fill-ins', { role: 'worker' });
  const { shortNoticeAvailable, isSaving, handleToggle } = useFillInAvailabilityToggle();

  useWorkerSetupStepGuard(
    'fill-ins',
    workerProfile,
    profile?.first_name,
    profile?.last_name,
    isWorkerProfileReady,
    isEditMode,
  );

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    form: { gap: spacing.lg },
    valueCard: {
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.secondarySubtle,
    },
    benefits: { gap: spacing.sm },
    benefitRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
    },
    benefitIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.surface,
    },
    benefitText: { flex: 1, gap: 2 },
    benefitTitle: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    benefitBody: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
    },
    footer: { gap: spacing.sm, marginTop: spacing.lg },
    footnote: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center' as const,
    },
  }));

  if (isEditMode) {
    return <Redirect href={WORKER_FILLIN_AVAILABILITY} />;
  }

  if (!isWorkerProfileReady) return null;

  const goToReview = () => router.push(WORKER_SETUP_REVIEW);

  return (
    <FormScreen
      {...setupFormProps}
      accent="secondary"
      title="Get same-day fill-ins"
      subtitle="Clinics near you post short-notice shifts. Turn on alerts so you hear about them first."
      onBack={() => router.back()}
      footer={
        <View style={styles.footer}>
          {shortNoticeAvailable ? (
            <OnboardingButton label="Continue" solid onPress={goToReview} />
          ) : (
            <>
              <OnboardingButton
                label={isSaving ? 'Turning on…' : 'Turn on fill-in alerts'}
                accent="secondary"
                disabled={isSaving}
                onPress={() => void handleToggle(true)}
              />
              <OnboardingButton
                label="Skip for now"
                variant="ghost"
                disabled={isSaving}
                onPress={goToReview}
              />
            </>
          )}
          <Text style={styles.footnote}>You can change this anytime in Fill-ins.</Text>
        </View>
      }>
      {progress.visible ? (
        <SetupStepProgress step={progress.step} total={progress.total} />
      ) : null}
      <View style={styles.form}>
        <View style={styles.valueCard}>
          <FillInSmsPreview />
          <View style={styles.benefits}>
            {BENEFITS.map((benefit) => (
              <View key={benefit.title} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={benefit.icon} size={16} color={colors.secondary} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitBody}>{benefit.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <FillInModePanel variant="grouped" />
      </View>
    </FormScreen>
  );
}
