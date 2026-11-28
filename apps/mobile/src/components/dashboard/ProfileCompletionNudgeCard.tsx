import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View, Text } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { AnalyticsEvents } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
import type { ProfileCompletionNudge } from '@/lib/profileCompletionNudge';
import { useTheme, useThemedStyles } from '@/theme';

type ProfileCompletionNudgeCardProps = {
  nudge: ProfileCompletionNudge;
  role: 'clinic' | 'worker';
};

/**
 * Dashboard prompt for an incomplete profile. It never blocks the dashboard;
 * the phone variant is worded around texts because SMS is the core feature.
 */
export function ProfileCompletionNudgeCard({ nudge, role }: ProfileCompletionNudgeCardProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${colors.primary}44`,
      backgroundColor: colors.primarySubtle,
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
      borderColor: `${colors.primary}33`,
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
  }));

  const handlePress = () => {
    captureAnalyticsEvent(AnalyticsEvents.profileCompletionNudgeTapped, {
      role,
      focus: nudge.focus,
    });
    router.push(nudge.href);
  };

  return (
    <View accessibilityRole="summary" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={
              nudge.focus === 'phone'
                ? 'chatbubble-ellipses-outline'
                : role === 'clinic'
                  ? 'business-outline'
                  : 'person-circle-outline'
            }
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{nudge.title}</Text>
          <Text style={styles.message}>{nudge.message}</Text>
        </View>
      </View>
      <OnboardingButton label={nudge.actionLabel} accent="primary" onPress={handlePress} />
    </View>
  );
}
