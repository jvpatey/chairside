import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useFillInAvailabilityToggle } from '@/hooks/useFillInAvailabilityToggle';
import { useFillInNudgeSnooze } from '@/hooks/useFillInNudgeSnooze';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { getFillInNudgeState, shouldShowFillInNudge } from '@/lib/fillInNudge';
import { WORKER_FILLIN_AVAILABILITY } from '@/lib/routing';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type FillInAlertsNudgeCardProps = {
  /**
   * `dashboard` covers fill-ins off and texts off, and can be snoozed for 14 days.
   * `inline` only covers fill-ins off (the summary card already prompts for texts) and can't be snoozed.
   */
  variant?: 'dashboard' | 'inline';
  openFillInCount?: number;
};

function formatOpenFillIns(count: number): string {
  return count === 1 ? '1 open fill-in' : `${count} open fill-ins`;
}

export function FillInAlertsNudgeCard({
  variant = 'dashboard',
  openFillInCount = 0,
}: FillInAlertsNudgeCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { workerProfile } = useWorkerProfile();
  const { snooze, isHydrated, snoozeState } = useFillInNudgeSnooze(user?.id);
  const { isSaving, handleToggle } = useFillInAvailabilityToggle();
  const state = getFillInNudgeState(workerProfile);
  const isDashboard = variant === 'dashboard';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${colors.secondary}44`,
      backgroundColor: colors.secondarySubtle,
      padding: spacing.md,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: `${colors.secondary}33`,
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    message: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    dismiss: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: -4,
      marginRight: -4,
      ...webPointer(),
    },
    actions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
  }));

  const visible = isDashboard
    ? isHydrated && shouldShowFillInNudge(state, snooze, Date.now())
    : state === 'fill_ins_off';

  if (!visible || !state) return null;

  const isOff = state === 'fill_ins_off';
  const title = isOff ? 'Fill-in alerts are off' : 'Get fill-ins by text';
  const message = isOff
    ? openFillInCount > 0
      ? `You won't hear about same-day shifts near you. ${formatOpenFillIns(openFillInCount)} in your province right now.`
      : "You won't hear about same-day shifts near you. Turn on alerts to be first in line."
    : 'Texts reach you fastest when a clinic needs cover today.';
  const openManage = () => router.push(WORKER_FILLIN_AVAILABILITY);

  const card = (
    <View accessibilityRole="summary" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isOff ? FILL_IN_ICON.outline : 'chatbubble-ellipses-outline'}
            size={20}
            color={colors.secondary}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        {isDashboard ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remind me later"
            hitSlop={8}
            onPress={() => void snoozeState(state)}
            style={styles.dismiss}>
            <Ionicons name="close" size={18} color={colors.labelTertiary} />
          </Pressable>
        ) : null}
      </View>
      {isOff ? (
        <View style={styles.actions}>
          <OnboardingButton
            label={isSaving ? 'Turning on…' : 'Turn on'}
            accent="secondary"
            split
            disabled={isSaving}
            onPress={() => void handleToggle(true)}
          />
          <OnboardingButton label="Manage" variant="secondary" split onPress={openManage} />
        </View>
      ) : (
        <OnboardingButton
          label="Set up texts"
          accent="secondary"
          onPress={openManage}
        />
      )}
    </View>
  );

  return isDashboard ? <FadeInSection delayMs={30}>{card}</FadeInSection> : card;
}
