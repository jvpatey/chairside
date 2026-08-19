import { getClinicWorkerCrmTagLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { PillBadge } from '@/components/ui/PillBadge';
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
import { useContentSwapAnimation } from '@/lib/webMotion.web';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles, type GradientAccent } from '@/theme';
import { webMotion } from '@/theme/web';

type FeaturesAudience = 'clinic' | 'professional';

type FeatureDef = {
  id: string;
  title: string;
  highlight: string;
  body: string;
  accent: GradientAccent;
};

const CLINIC_FEATURES: readonly FeatureDef[] = [
  {
    id: 'match',
    title: 'Match, filter, and flag',
    highlight: 'flag',
    body: 'Match scores and tags at a glance.',
    accent: 'secondary',
  },
  {
    id: 'outreach',
    title: 'Reach professionals nearby',
    highlight: 'nearby',
    body: 'Notify available professionals for same-day cover.',
    accent: 'secondary',
  },
  {
    id: 'roles',
    title: 'Post permanent roles',
    highlight: 'permanent',
    body: 'Permanent roles live alongside fill-ins.',
    accent: 'primary',
  },
] as const;

const PROFESSIONAL_FEATURES: readonly FeatureDef[] = [
  {
    id: 'availability',
    title: 'Alerts on your terms',
    highlight: 'your terms',
    body: 'Turn on when you want shifts. Mute anytime.',
    accent: 'secondary',
  },
  {
    id: 'alerts',
    title: 'Never miss a shift',
    highlight: 'shift',
    body: 'Openings land as push and text.',
    accent: 'secondary',
  },
  {
    id: 'message',
    title: 'Message the clinic',
    highlight: 'clinic',
    body: 'Confirm shift details in-app.',
    accent: 'primary',
  },
] as const;

const AUDIENCE_SUBTITLE: Record<FeaturesAudience, string> = {
  clinic: 'Match candidates, reach available professionals, and post permanent roles — all in one place.',
  professional: 'Stay available when you want shifts, get alerted for nearby fill-ins, and message clinics in-app.',
};

const SNAPSHOT_MIN_HEIGHT = 168;

function phaseStyle(visible: boolean, offsetY = 10, delayMs = 0) {
  const delay = delayMs > 0 ? ` ${delayMs}ms` : '';
  return webOnlyStyle({
    opacity: visible ? 1 : 0,
    transform: [{ translateY: visible ? 0 : offsetY }],
    transition: `opacity 420ms ${webMotion.easingOut}${delay}, transform 420ms ${webMotion.easingOut}${delay}`,
    pointerEvents: visible ? 'auto' : 'none',
  } as object);
}

function FeaturesAudienceToggle({
  value,
  onChange,
}: {
  value: FeaturesAudience;
  onChange: (audience: FeaturesAudience) => void;
}) {
  const { isDark } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    wrap: {
      alignSelf: 'flex-start' as const,
      width: '100%' as const,
      maxWidth: 360,
      marginBottom: spacing.xl,
    },
    row: {
      flexDirection: 'row' as const,
      backgroundColor: colors.fillSubtle,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: 3,
      gap: 3,
    },
    option: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.sm + 2,
      minHeight: 44,
      ...webOnlyStyle({
        transition: 'background-color 0.18s ease, border-color 0.18s ease',
        cursor: 'pointer',
      } as object),
    },
    optionSelected: {
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colorWithAlpha(colors.primaryOnPrimary, isDark ? 0.12 : 0.2),
    },
    label: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
    },
    labelSelected: {
      color: colors.primaryOnPrimary,
      fontWeight: '700' as const,
    },
  }));

  const options: { id: FeaturesAudience; label: string }[] = [
    { id: 'clinic', label: 'Clinics' },
    { id: 'professional', label: 'Professionals' },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.row} accessibilityRole="tablist">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.id)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SnapshotFrame({ children }: { children: React.ReactNode }) {
  return (
    <WebMarketingSnapshotShell
      style={{ flex: 1, minHeight: SNAPSHOT_MIN_HEIGHT, justifyContent: 'center' }}
    >
      {children}
    </WebMarketingSnapshotShell>
  );
}

/** Match → filter tags → flag appears. */
function ClinicMatchVisual() {
  const preview = useMemo(() => getWelcomeHeroPreview(), []);
  const applicant = preview.applicants[0];
  const { colors } = useTheme();
  const schedule = useMemo(() => [0, 1100, 2200] as const, []);
  const { ref, phase } = useInViewPhaseLoop(schedule, 5600);
  const showTags = phase >= 1;
  const showFlag = phase >= 2;

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
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    body: { flex: 1, minWidth: 0, gap: 4 },
    nameRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
    },
    name: {
      flex: 1,
      minWidth: 0,
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    detail: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
    tags: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 6,
      minHeight: 24,
    },
    flaggedBadge: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: `${colors.warning}14`,
      borderColor: `${colors.warning}40`,
    },
    flaggedText: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
  }));

  return (
    <SnapshotFrame>
      <View ref={ref} style={styles.card}>
        <View style={styles.row}>
          <WorkerProfileAvatar displayName={applicant.name} size={36} />
          <View style={styles.body}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {applicant.name}
              </Text>
              <MatchTierBadge
                breakdown={applicant.match}
                context={applicant.matchContext}
                subtitle={preview.job.title}
                audience="clinic"
              />
            </View>
            <Text style={styles.detail} numberOfLines={1}>
              {applicant.yearsOfExperience} years · Hygienist · Nearby
            </Text>
          </View>
        </View>
        <View style={styles.tags}>
          <View style={phaseStyle(showFlag, 6)}>
            <View style={styles.flaggedBadge}>
              <Text style={styles.flaggedText}>Flagged</Text>
            </View>
          </View>
          <View style={phaseStyle(showTags, 8)}>
            <PillBadge
              label={getClinicWorkerCrmTagLabel('follow_up_later')}
              size="sm"
              color={colors.labelSecondary}
              backgroundColor={colors.surface}
              borderColor={colors.separator}
            />
          </View>
        </View>
      </View>
    </SnapshotFrame>
  );
}

/** Available professionals appear, then notify / sent. */
function ClinicOutreachVisual() {
  const preview = useMemo(() => getWelcomeHeroPreview(), []);
  const pros = preview.applicants.slice(0, 2);
  const schedule = useMemo(() => [0, 1200, 2400] as const, []);
  const { ref, phase } = useInViewPhaseLoop(schedule, 5600);
  const showSecond = phase >= 1;
  const notified = phase >= 2;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    heading: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      color: colors.labelSecondary,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    body: { flex: 1, minWidth: 0, gap: 2 },
    name: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    detail: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
    available: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: colors.secondary,
    },
    ctaStage: {
      position: 'relative' as const,
      minHeight: 40,
      marginTop: 2,
    },
  }));

  return (
    <SnapshotFrame>
      <View ref={ref} style={styles.card}>
        <Text style={styles.heading}>Available nearby</Text>
        <View style={styles.row}>
          <WorkerProfileAvatar displayName={pros[0].name} size={32} />
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {pros[0].name}
            </Text>
            <Text style={styles.detail} numberOfLines={1}>
              Available · Nearby
            </Text>
          </View>
          <Text style={styles.available}>Free today</Text>
        </View>
        <View style={[styles.row, phaseStyle(showSecond, 8)]}>
          <WorkerProfileAvatar displayName={pros[1]?.name ?? 'Sam'} size={32} />
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {pros[1]?.name ?? 'Sam'}
            </Text>
            <Text style={styles.detail} numberOfLines={1}>
              Available · Nearby
            </Text>
          </View>
          <Text style={styles.available}>Free today</Text>
        </View>
        <View style={styles.ctaStage}>
          <View
            style={[
              { position: 'absolute', left: 0, right: 0, top: 0 },
              phaseStyle(!notified, 8),
            ]}
          >
            <OnboardingButton label="Notify professionals" accent="secondary" onPress={() => {}} />
          </View>
          <View style={phaseStyle(notified, 8)}>
            <OnboardingButton label="Notified · 2" accent="secondary" onPress={() => {}} />
          </View>
        </View>
      </View>
    </SnapshotFrame>
  );
}

/** Incoming bubble, then reply — professionals only. */
function MessagingVisual() {
  const schedule = useMemo(() => [0, 1200] as const, []);
  const { ref, phase } = useInViewPhaseLoop(schedule, 4800);
  const showReply = phase >= 1;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    stack: {
      gap: spacing.sm,
      minHeight: 88,
      justifyContent: 'center' as const,
    },
    bubble: {
      maxWidth: '88%' as const,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 14,
    },
    them: {
      alignSelf: 'flex-start' as const,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderBottomLeftRadius: 4,
    },
    me: {
      alignSelf: 'flex-end' as const,
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    themText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelPrimary,
    },
    meText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.primaryOnPrimary,
    },
  }));

  return (
    <SnapshotFrame>
      <View ref={ref} style={styles.stack}>
        <View style={[styles.bubble, styles.them]}>
          <Text style={styles.themText}>Still need coverage today?</Text>
        </View>
        <View style={[styles.bubble, styles.me, phaseStyle(showReply, 10)]}>
          <Text style={styles.meText}>Yes — I can be there by 9.</Text>
        </View>
      </View>
    </SnapshotFrame>
  );
}

/** Compact permanent role card — no oversized RoleListingCard. */
function ClinicRolesVisual() {
  const schedule = useMemo(() => [0, 1600] as const, []);
  const { ref, phase } = useInViewPhaseLoop(schedule, 5000);
  const live = phase >= 1;

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
      gap: spacing.sm,
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
    wage: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.primary,
    },
    status: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.primarySubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: colors.primary,
    },
  }));

  return (
    <SnapshotFrame>
      <View ref={ref} style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>Dental Hygienist</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>Full-time</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Wage</Text>
          <Text style={styles.wage}>$42–$48 / hr</Text>
        </View>
        <View style={[styles.status, phaseStyle(live, 8)]}>
          <Text style={styles.statusText}>{live ? 'Live · Accepting applicants' : 'Draft'}</Text>
        </View>
      </View>
    </SnapshotFrame>
  );
}

/** Toggle off → on, then alert chips appear. */
function ProfessionalAvailabilityVisual() {
  const { colors } = useTheme();
  const schedule = useMemo(() => [0, 900, 1800] as const, []);
  const { ref, phase } = useInViewPhaseLoop(schedule, 5200);
  const on = phase >= 1;
  const showChips = phase >= 2;

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
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
    },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    title: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    hint: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
    track: {
      width: 46,
      height: 28,
      borderRadius: 999,
      padding: 3,
      justifyContent: 'center' as const,
      ...webOnlyStyle({
        transition: `background-color 320ms ${webMotion.easingOut}`,
      } as object),
    },
    thumb: {
      width: 22,
      height: 22,
      borderRadius: 999,
      backgroundColor: '#FFFFFF',
      ...webOnlyStyle({
        transition: `transform 320ms ${webMotion.easingOut}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      } as object),
    },
    chips: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 6,
      minHeight: 28,
    },
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: 999,
      backgroundColor: colors.secondarySubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.secondary,
    },
  }));

  return (
    <SnapshotFrame>
      <View ref={ref} style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.title}>Available for fill-ins</Text>
            <Text style={styles.hint}>Alerts only while this is on.</Text>
          </View>
          <View
            style={[
              styles.track,
              { backgroundColor: on ? colors.secondary : colors.fillSubtle },
            ]}
          >
            <View
              style={[
                styles.thumb,
                webOnlyStyle({
                  transform: [{ translateX: on ? 18 : 0 }],
                } as object),
              ]}
            />
          </View>
        </View>
        <View style={[styles.chips, phaseStyle(showChips, 8)]}>
          <View style={styles.chip}>
            <Ionicons name="notifications" size={12} color={colors.secondary} />
            <Text style={styles.chipText}>Push on</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="chatbubble-ellipses" size={12} color={colors.secondary} />
            <Text style={styles.chipText}>SMS on</Text>
          </View>
        </View>
      </View>
    </SnapshotFrame>
  );
}

/** Push, then SMS. */
function ProfessionalAlertsVisual() {
  const { colors } = useTheme();
  const schedule = useMemo(() => [0, 1000] as const, []);
  const { ref, phase } = useInViewPhaseLoop(schedule, 4800);
  const showSms = phase >= 1;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    stack: {
      gap: 10,
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
    <SnapshotFrame>
      <View ref={ref} style={styles.stack}>
        <View style={styles.card}>
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
    </SnapshotFrame>
  );
}

function FeatureVisual({
  audience,
  featureId,
}: {
  audience: FeaturesAudience;
  featureId: string;
}) {
  if (audience === 'clinic') {
    if (featureId === 'match') return <ClinicMatchVisual />;
    if (featureId === 'outreach') return <ClinicOutreachVisual />;
    return <ClinicRolesVisual />;
  }
  if (featureId === 'availability') return <ProfessionalAvailabilityVisual />;
  if (featureId === 'alerts') return <ProfessionalAlertsVisual />;
  return <MessagingVisual />;
}

function FeatureTile({
  feature,
  audience,
  enterDelayMs,
}: {
  feature: FeatureDef;
  audience: FeaturesAudience;
  enterDelayMs?: number;
}) {
  const styles = useThemedStyles(({ colors }) => ({
    card: {
      minHeight: 292,
    },
    copy: {
      gap: 4,
      minHeight: 52,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    visual: {
      flex: 1,
      minHeight: SNAPSHOT_MIN_HEIGHT,
    },
  }));

  return (
    <WebPageEnter delayMs={enterDelayMs} style={{ flex: 1, minWidth: 0 }} trigger="visible">
      <WebMarketingCard style={styles.card}>
        <View style={styles.copy}>
          <WebMarketingCardTitle
            title={feature.title}
            highlight={feature.highlight}
            accent={feature.accent}
          />
          <Text style={styles.body}>{feature.body}</Text>
        </View>
        <View style={styles.visual}>
          <FeatureVisual audience={audience} featureId={feature.id} />
        </View>
      </WebMarketingCard>
    </WebPageEnter>
  );
}

function FeaturesAudiencePanel({
  audience,
  isWide,
}: {
  audience: FeaturesAudience;
  isWide: boolean;
}) {
  const { opacity, translateY, displayKey } = useContentSwapAnimation(audience);
  const displayAudience = displayKey as FeaturesAudience;
  const features =
    displayAudience === 'clinic' ? CLINIC_FEATURES : PROFESSIONAL_FEATURES;

  const styles = useThemedStyles(({ spacing }) => ({
    grid: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.lg,
      alignItems: 'stretch' as const,
    },
  }));

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY }] }]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.grid}>
        {features.map((feature, index) => (
          <FeatureTile
            key={`${displayAudience}-${feature.id}`}
            feature={feature}
            audience={displayAudience}
            enterDelayMs={80 + index * 80}
          />
        ))}
      </View>
    </Animated.View>
  );
}

export function WebLandingFeatures() {
  const { isWide } = useResponsiveLayout();
  const [audience, setAudience] = useState<FeaturesAudience>('clinic');

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
          ? 'radial-gradient(ellipse 70% 55% at 12% 18%, rgba(74, 154, 255, 0.1) 0%, transparent 58%)'
          : 'radial-gradient(ellipse 70% 55% at 12% 18%, rgba(26, 111, 212, 0.06) 0%, transparent 58%)',
      } as object),
    },
  }));

  return (
    <WebMarketingSection
      style={styles.bleed}
      sectionId="features"
      atmosphere={<View style={styles.atmosphere} />}
    >
      <WebMarketingSectionHeader
        eyebrow="Features"
        title="Built for how dental teams actually work"
        subtitle={AUDIENCE_SUBTITLE[audience]}
      />

      <FeaturesAudienceToggle
        value={audience}
        onChange={(next) => {
          if (next === audience) return;
          setAudience(next);
        }}
      />

      <FeaturesAudiencePanel audience={audience} isWide={isWide} />
    </WebMarketingSection>
  );
}
