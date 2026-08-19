import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { type HeroDemoPhase } from '@/components/onboarding/welcomeHeroDemo';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import type { WelcomeHeroPreview } from '@/lib/welcomeHeroPreview';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { webMotion } from '@/theme/web';

type WelcomeHeroFillInCardProps = {
  preview: WelcomeHeroPreview;
  embedded?: boolean;
  /** When set, crossfades compose → request → confirmed with the hero demo loop. */
  demoPhase?: HeroDemoPhase;
};

const CROSSFADE = `opacity 480ms ${webMotion.easingOut}, transform 480ms ${webMotion.easingOut}`;

function phaseStyle(visible: boolean, offsetY = 10) {
  return webOnlyStyle({
    opacity: visible ? 1 : 0,
    transform: [{ translateY: visible ? 0 : offsetY }],
    transition: CROSSFADE,
    pointerEvents: visible ? 'auto' : 'none',
  } as object);
}

/**
 * Slim marketing fill-in card with crossfaded phases:
 * - post: role + Today 9–5 + Post fill-in
 * - alert: cover request + Accept
 * - covered/idle: Fill-in confirmed
 */
export function WelcomeHeroFillInCard({
  preview,
  embedded = false,
  demoPhase,
}: WelcomeHeroFillInCardProps) {
  const { colors } = useTheme();
  const applicant = preview.applicants[0];
  const showCompose = demoPhase === 'post';
  const showRequest = demoPhase === 'alert';
  const showConfirmed =
    demoPhase == null || demoPhase === 'idle' || demoPhase === 'covered';

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      padding: spacing.md,
      gap: spacing.md,
    },
    roleBlock: {
      gap: 4,
    },
    roleLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      color: colors.labelSecondary,
    },
    roleTitle: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    when: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700' as const,
      color: colors.secondary,
    },
    actionStage: {
      position: 'relative' as const,
      minHeight: 120,
    },
    actionLayer: {
      width: '100%' as const,
    },
    actionLayerAbsolute: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
    },
    request: {
      gap: spacing.sm,
    },
    requestRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    requestBody: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    name: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    detail: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
    confirmed: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.tertiary,
      backgroundColor: colors.tertiarySubtle,
      padding: spacing.md,
      gap: spacing.sm,
    },
    confirmedHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    confirmedIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.tertiary,
    },
    confirmedCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    confirmedTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.tertiary,
    },
    confirmedDetail: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  return (
    <SurfaceCard variant={embedded ? 'inner' : 'default'} padding="none">
      <View style={styles.card}>
        <View style={styles.roleBlock}>
          <Text style={styles.roleLabel}>Fill-in</Text>
          <Text style={styles.roleTitle}>Dental Hygienist</Text>
          <Text style={styles.when}>Today · 9–5</Text>
        </View>

        <View style={styles.actionStage}>
          <View
            style={[
              styles.actionLayer,
              styles.actionLayerAbsolute,
              phaseStyle(showCompose, 8),
            ]}
          >
            <OnboardingButton label="Post fill-in" accent="secondary" onPress={() => {}} />
          </View>

          <View
            style={[
              styles.actionLayer,
              styles.actionLayerAbsolute,
              phaseStyle(showRequest, 12),
            ]}
          >
            <View style={styles.request}>
              <View style={styles.requestRow}>
                <WorkerProfileAvatar displayName={applicant.name} size={36} />
                <View style={styles.requestBody}>
                  <Text style={styles.name} numberOfLines={1}>
                    {applicant.name}
                  </Text>
                  <Text style={styles.detail} numberOfLines={1}>
                    Hygienist · Just now
                  </Text>
                </View>
                <ApplicationCardBadge label="New request" />
              </View>
              <OnboardingButton label="Accept" accent="tertiary" onPress={() => {}} />
            </View>
          </View>

          <View style={[styles.actionLayer, phaseStyle(showConfirmed, 10)]}>
            <View style={styles.confirmed}>
              <View style={styles.confirmedHeader}>
                <View style={styles.confirmedIcon}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.confirmedCopy}>
                  <Text style={styles.confirmedTitle}>Fill-in confirmed</Text>
                  <Text style={styles.confirmedDetail} numberOfLines={1}>
                    {applicant.name} covering Today · 9–5
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SurfaceCard>
  );
}
