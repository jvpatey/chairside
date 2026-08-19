import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { WebMarketingSection } from '@/components/web/marketing/WebMarketingSection.web';
import {
  WebMarketingCard,
  WebMarketingCardTitle,
  WebMarketingSectionHeader,
  WebMarketingSnapshotShell,
} from '@/components/web/marketing/WebMarketingSnapshotShell.web';
import { WelcomeSmsPreview } from '@/components/web/marketing/WelcomeSmsPreview.web';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useInViewPhaseLoop } from '@/lib/webMarketingBeatLoop.web';
import { getWelcomeHeroPreview } from '@/lib/welcomeHeroPreview';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { webMotion } from '@/theme/web';

const BEATS = [
  {
    id: 'post',
    step: '01',
    title: 'Post in minutes',
    highlight: 'minutes',
    accent: 'secondary' as const,
  },
  {
    id: 'alert',
    step: '02',
    title: 'Professionals get alerted',
    highlight: 'alerted',
    accent: 'secondary' as const,
  },
  {
    id: 'confirm',
    step: '03',
    title: 'Confirm and cover',
    highlight: 'cover',
    accent: 'tertiary' as const,
  },
] as const;

const SNAPSHOT_MIN_HEIGHT = 200;
const CROSSFADE = `opacity 480ms ${webMotion.easingOut}, transform 480ms ${webMotion.easingOut}`;

function phaseStyle(visible: boolean, offsetY = 10, delayMs = 0) {
  const delay = delayMs > 0 ? ` ${delayMs}ms` : '';
  return webOnlyStyle({
    opacity: visible ? 1 : 0,
    transform: [{ translateY: visible ? 0 : offsetY }],
    transition: `opacity 480ms ${webMotion.easingOut}${delay}, transform 480ms ${webMotion.easingOut}${delay}`,
    pointerEvents: visible ? 'auto' : 'none',
  } as object);
}

function PostBeat() {
  // 0 = compose, 1 = posted flash
  const schedule = useMemo(() => [0, 1600] as const, []);
  const { ref, phase } = useInViewPhaseLoop(schedule, 4200);
  const posted = phase >= 1;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    label: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
    },
    value: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    valueAccent: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.secondary,
    },
    ctaStage: {
      position: 'relative' as const,
      minHeight: 44,
    },
  }));

  return (
    <WebMarketingSnapshotShell style={{ flex: 1, minHeight: SNAPSHOT_MIN_HEIGHT }}>
      <View ref={ref} style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>Dental Hygienist</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>When</Text>
          <Text style={styles.valueAccent}>Today · 9–5</Text>
        </View>
        <View style={styles.ctaStage}>
          <View
            style={[
              { position: 'absolute', left: 0, right: 0, top: 0 },
              phaseStyle(!posted, 8),
            ]}
          >
            <OnboardingButton label="Post fill-in" accent="secondary" onPress={() => {}} />
          </View>
          <View style={phaseStyle(posted, 8)}>
            <OnboardingButton label="Posted" accent="secondary" onPress={() => {}} />
          </View>
        </View>
      </View>
    </WebMarketingSnapshotShell>
  );
}

function AlertBeat() {
  const { colors } = useTheme();
  // 0 = push only, 1 = push + SMS
  const schedule = useMemo(() => [0, 900] as const, []);
  const { ref, phase } = useInViewPhaseLoop(schedule, 4800);
  const showSms = phase >= 1;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    stack: {
      gap: 10,
      flex: 1,
      justifyContent: 'center' as const,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.sm + 2,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.secondarySubtle,
    },
    title: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    body: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebMarketingSnapshotShell style={{ flex: 1, minHeight: SNAPSHOT_MIN_HEIGHT }}>
      <View ref={ref} style={styles.stack}>
        <View
          style={[
            styles.card,
            webOnlyStyle({
              opacity: 1,
              transform: [{ translateY: 0 }],
              transition: CROSSFADE,
            } as object),
          ]}
        >
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name="notifications" size={14} color={colors.secondary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>New fill-in nearby</Text>
              <Text style={styles.body} numberOfLines={2}>
                Dental Hygienist · Today 9–5
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.card, phaseStyle(showSms, 12)]}>
          <WelcomeSmsPreview />
        </View>
      </View>
    </WebMarketingSnapshotShell>
  );
}

function ConfirmBeat() {
  const preview = useMemo(() => getWelcomeHeroPreview(), []);
  const applicant = preview.applicants[0];
  // 0 = request, 1 = confirmed
  const schedule = useMemo(() => [0, 1800] as const, []);
  const { ref, phase } = useInViewPhaseLoop(schedule, 5200);
  const confirmed = phase >= 1;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    stage: {
      position: 'relative' as const,
      flex: 1,
      minHeight: SNAPSHOT_MIN_HEIGHT - 24,
      justifyContent: 'center' as const,
    },
    layer: {
      width: '100%' as const,
    },
    layerAbsolute: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center' as const,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    confirmed: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.tertiary,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    body: { flex: 1, minWidth: 0, gap: 2 },
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
    actions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    action: { flex: 1, minWidth: 0 },
    confirmIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.tertiary,
    },
    confirmTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.tertiary,
    },
  }));

  return (
    <WebMarketingSnapshotShell style={{ flex: 1, minHeight: SNAPSHOT_MIN_HEIGHT }}>
      <View ref={ref} style={styles.stage}>
        <View style={[styles.layerAbsolute, phaseStyle(!confirmed, 12)]}>
          <View style={styles.card}>
            <View style={styles.row}>
              <WorkerProfileAvatar displayName={applicant.name} size={36} />
              <View style={styles.body}>
                <Text style={styles.name} numberOfLines={1}>
                  {applicant.name}
                </Text>
                <Text style={styles.detail} numberOfLines={1}>
                  Hygienist · Just now
                </Text>
              </View>
              <ApplicationCardBadge label="New request" />
            </View>
            <View style={styles.actions}>
              <OnboardingButton
                style={styles.action}
                label="Accept"
                accent="tertiary"
                onPress={() => {}}
              />
              <OnboardingButton
                style={styles.action}
                label="Decline"
                variant="destructive"
                onPress={() => {}}
              />
            </View>
          </View>
        </View>

        <View style={[styles.layerAbsolute, phaseStyle(confirmed, 12)]}>
          <View style={styles.confirmed}>
            <View style={styles.row}>
              <View style={styles.confirmIcon}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.body}>
                <Text style={styles.confirmTitle}>Fill-in confirmed</Text>
                <Text style={styles.detail} numberOfLines={1}>
                  {applicant.name} covering Today · 9–5
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </WebMarketingSnapshotShell>
  );
}

function BeatVisual({ id }: { id: (typeof BEATS)[number]['id'] }) {
  if (id === 'post') return <PostBeat />;
  if (id === 'alert') return <AlertBeat />;
  return <ConfirmBeat />;
}

function StoryBeat({
  beat,
  index,
}: {
  beat: (typeof BEATS)[number];
  index: number;
}) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    stepChip: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor:
        beat.accent === 'tertiary' ? colors.tertiarySubtle : colors.secondarySubtle,
    },
    stepText: {
      fontSize: 12,
      fontWeight: '700' as const,
      letterSpacing: 0.4,
      color: beat.accent === 'tertiary' ? colors.tertiary : colors.secondary,
    },
    title: {
      flex: 1,
      minWidth: 0,
    },
  }));

  return (
    <WebPageEnter
      delayMs={120 + index * 160}
      style={{ flex: 1, minWidth: 0 }}
      trigger="visible"
    >
      <WebMarketingCard>
        <View style={styles.titleRow}>
          <View style={styles.stepChip}>
            <Text style={styles.stepText}>{beat.step}</Text>
          </View>
          <WebMarketingCardTitle
            title={beat.title}
            highlight={beat.highlight}
            accent={beat.accent}
            style={styles.title}
          />
        </View>
        <BeatVisual id={beat.id} />
      </WebMarketingCard>
    </WebPageEnter>
  );
}

export function WebLandingStory() {
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    bleed: {
      paddingVertical: spacing.xl * 2.5,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      overflow: 'hidden' as const,
    },
    atmosphere: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 70% 50% at 10% 20%, rgba(74, 154, 255, 0.1) 0%, transparent 58%)'
          : 'radial-gradient(ellipse 70% 50% at 10% 20%, rgba(26, 111, 212, 0.06) 0%, transparent 58%)',
      } as object),
    },
    stage: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      alignItems: 'stretch' as const,
      gap: spacing.lg,
    },
  }));

  return (
    <WebMarketingSection
      style={styles.bleed}
      sectionId="how-it-works"
      atmosphere={<View style={styles.atmosphere} />}
    >
      <WebMarketingSectionHeader
        eyebrow="How it works"
        title="Coverage before the first patient"
        subtitle="Last-minute coverage, without the scramble."
      />

      <View style={styles.stage}>
        {BEATS.map((beat, index) => (
          <StoryBeat key={beat.id} beat={beat} index={index} />
        ))}
      </View>
    </WebMarketingSection>
  );
}
