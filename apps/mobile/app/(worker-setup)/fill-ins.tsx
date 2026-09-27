import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FadeSwap } from '@/components/ui/FadeSwap';
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
import { getFillInSmsStatus } from '@/lib/fillInAvailabilitySummary';
import { WORKER_FILLIN_AVAILABILITY, WORKER_SETUP_REVIEW } from '@/lib/routing';
import { webPointer } from '@/lib/webPressableStyles';
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
    icon: 'options-outline',
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
  const { isSaving, error: toggleError, handleToggle } = useFillInAvailabilityToggle();
  // Saved profile state (not the optimistic toggle) so the view swaps once, after the save,
  // with the settings panel already populated.
  const isOn = Boolean(workerProfile?.short_notice_available);
  const textsOn = getFillInSmsStatus(workerProfile).smsActive;

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
    previewCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.secondarySubtle,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: colors.secondary,
    },
    benefits: { gap: spacing.md },
    benefitRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    },
    benefitIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.secondarySubtle,
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
    onBanner: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: `${colors.success}40`,
      backgroundColor: `${colors.success}14`,
    },
    onBannerText: { flex: 1, gap: 2 },
    onBannerTitle: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    onBannerBody: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
    },
    turnOff: {
      paddingVertical: 2,
      ...webPointer(),
    },
    turnOffText: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
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

  const offContent = (
    <View style={styles.form}>
      <View style={styles.previewCard}>
        <Text style={styles.eyebrow}>What an alert looks like</Text>
        <FillInSmsPreview />
      </View>
      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit.title} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name={benefit.icon} size={18} color={colors.secondary} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitBody}>{benefit.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const onContent = (
    <View style={styles.form}>
      <View style={styles.onBanner}>
        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        <View style={styles.onBannerText}>
          <Text style={styles.onBannerTitle}>Fill-in alerts are on</Text>
          <Text style={styles.onBannerBody}>
            {textsOn
              ? 'You’ll get fill-ins by notification and text.'
              : 'You’ll get a notification when clinics near you post. Add texts below so you never miss one.'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Turn off fill-in alerts"
          disabled={isSaving}
          onPress={() => void handleToggle(false)}
          style={styles.turnOff}>
          <Text style={styles.turnOffText}>{isSaving ? 'Turning off…' : 'Turn off'}</Text>
        </Pressable>
      </View>
      <FillInModePanel variant="grouped" hidePrimaryToggle />
    </View>
  );

  return (
    <FormScreen
      {...setupFormProps}
      accent="secondary"
      title={isOn ? 'Set up your fill-in alerts' : 'Get same-day fill-ins'}
      subtitle={
        isOn
          ? 'Choose how clinics reach you. You can change this anytime in Fill-ins.'
          : 'Clinics near you post short-notice shifts. Turn on alerts so you hear about them first.'
      }
      onBack={() => router.back()}
      footer={
        <FadeSwap swapKey={isOn ? 'on' : 'off'} style={styles.footer}>
          {toggleError ? <FormErrorBanner message={toggleError} /> : null}
          {isOn ? (
            <OnboardingButton label="Continue" solid disabled={isSaving} onPress={goToReview} />
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
              <Text style={styles.footnote}>You can turn this on anytime in Fill-ins.</Text>
            </>
          )}
        </FadeSwap>
      }>
      {progress.visible ? (
        <SetupStepProgress step={progress.step} total={progress.total} />
      ) : null}
      <FadeSwap swapKey={isOn ? 'on' : 'off'}>{isOn ? onContent : offContent}</FadeSwap>
    </FormScreen>
  );
}
