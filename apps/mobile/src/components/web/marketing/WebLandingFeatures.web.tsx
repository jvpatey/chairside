import { getClinicWorkerCrmTagLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { PillBadge } from '@/components/ui/PillBadge';
import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { WebMarketingSection } from '@/components/web/marketing/WebMarketingSection.web';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { getWelcomeHeroPreview } from '@/lib/welcomeHeroPreview';
import { useContentSwapAnimation } from '@/lib/webMotion.web';
import { webCardLiftBase, webOnlyStyle, useWebCardLift } from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles, type GradientAccent } from '@/theme';
import { getWebShadow, webSectionEyebrowStyle, webTypography } from '@/theme/web';

type FeaturesAudience = 'clinic' | 'professional';

type FeatureDef = {
  id: string;
  title: string;
  highlight: string;
  body: string;
  accent: GradientAccent;
  lead?: boolean;
};

const CLINIC_FEATURES: readonly FeatureDef[] = [
  {
    id: 'confirm',
    title: 'Confirm coverage fast',
    highlight: 'fast',
    body: 'Accept or decline cover requests the moment they come in.',
    accent: 'secondary',
    lead: true,
  },
  {
    id: 'match',
    title: 'Match, filter, and flag',
    highlight: 'flag',
    body: 'Match scores plus tags so you keep the right people close.',
    accent: 'secondary',
  },
  {
    id: 'message',
    title: 'Message in Chairside',
    highlight: 'Chairside',
    body: 'Coordinate coverage without leaving the platform.',
    accent: 'primary',
  },
] as const;

const PROFESSIONAL_FEATURES: readonly FeatureDef[] = [
  {
    id: 'availability',
    title: "Show you're free",
    highlight: "you're free",
    body: 'Turn on availability — get push and SMS when a fill-in opens nearby.',
    accent: 'secondary',
    lead: true,
  },
  {
    id: 'alerts',
    title: 'Never miss a shift',
    highlight: 'shift',
    body: 'Same-day openings land as push and text so you can respond immediately.',
    accent: 'secondary',
  },
  {
    id: 'message',
    title: 'Message the clinic',
    highlight: 'clinic',
    body: 'Ask about the shift and confirm details in-app.',
    accent: 'primary',
  },
] as const;

const AUDIENCE_SUBTITLE: Record<FeaturesAudience, string> = {
  clinic: 'Fill short-notice chairs fast — confirm coverage, match candidates, and message in one place.',
  professional: 'Get alerted when fill-ins open nearby, stay available, and message clinics in-app.',
};

function FeaturesAudienceToggle({
  value,
  onChange,
}: {
  value: FeaturesAudience;
  onChange: (audience: FeaturesAudience) => void;
}) {
  const { colors, isDark } = useTheme();

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

function SnapshotShell({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        borderRadius: 14,
        padding: 12,
        backgroundColor: colors.backgroundGrouped,
        borderWidth: 1,
        borderColor: colors.separator,
        gap: 10,
      }}
    >
      {children}
    </View>
  );
}

function ClinicConfirmVisual() {
  const preview = useMemo(() => getWelcomeHeroPreview(), []);
  const applicant = preview.applicants[0];

  const styles = useThemedStyles(({ colors, spacing }) => ({
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
  }));

  return (
    <SnapshotShell>
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
          accent="secondary"
          onPress={() => {}}
        />
        <OnboardingButton
          style={styles.action}
          label="Decline"
          variant="destructive"
          onPress={() => {}}
        />
      </View>
    </SnapshotShell>
  );
}

function ClinicMatchVisual() {
  const preview = useMemo(() => getWelcomeHeroPreview(), []);
  const applicant = preview.applicants[0];
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
    },
    body: { flex: 1, minWidth: 0, gap: spacing.xs },
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
    <SnapshotShell>
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
          <View style={styles.tags}>
            <View style={styles.flaggedBadge}>
              <Text style={styles.flaggedText}>Flagged</Text>
            </View>
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
    </SnapshotShell>
  );
}

function MessagingVisual({
  audience,
}: {
  audience: FeaturesAudience;
}) {
  const isClinic = audience === 'clinic';
  const bubbles = isClinic
    ? [
        { from: 'them' as const, text: 'I can cover 9–5 today.' },
        { from: 'me' as const, text: 'Perfect — you’re confirmed.' },
      ]
    : [
        { from: 'them' as const, text: 'Still need coverage today?' },
        { from: 'me' as const, text: 'Yes — I can be there by 9.' },
      ];

  const styles = useThemedStyles(({ colors, spacing }) => ({
    stack: { gap: spacing.sm },
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
    <SnapshotShell>
      <View style={styles.stack}>
        {bubbles.map((bubble) => (
          <View
            key={bubble.text}
            style={[styles.bubble, bubble.from === 'me' ? styles.me : styles.them]}
          >
            <Text style={bubble.from === 'me' ? styles.meText : styles.themText}>{bubble.text}</Text>
          </View>
        ))}
      </View>
    </SnapshotShell>
  );
}

function ProfessionalAvailabilityVisual() {
  const { colors, spacing } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    chips: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 6,
    },
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: 999,
      backgroundColor: colors.surface,
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
    <SnapshotShell>
      <SurfaceCard variant="inner" padding="md">
        <SettingsToggleRow
          prominence="primary"
          title="Available for fill-ins"
          hint="Open to short-notice coverage nearby."
          value
          accentColor={colors.secondary}
          bleedPadding={spacing.md}
          onValueChange={() => {}}
        />
      </SurfaceCard>
      <View style={styles.chips}>
        <View style={styles.chip}>
          <Ionicons name="notifications" size={12} color={colors.secondary} />
          <Text style={styles.chipText}>Push on</Text>
        </View>
        <View style={styles.chip}>
          <Ionicons name="chatbubble-ellipses" size={12} color={colors.secondary} />
          <Text style={styles.chipText}>SMS on</Text>
        </View>
      </View>
    </SnapshotShell>
  );
}

function ProfessionalAlertsVisual() {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.sm + 2,
      gap: 4,
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
    <SnapshotShell>
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
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name={FILL_IN_ICON.outline} size={14} color={colors.secondary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>SMS · Chairside</Text>
            <Text style={styles.body} numberOfLines={2}>
              Same-day hygienist fill-in opened near you.
            </Text>
          </View>
        </View>
      </View>
    </SnapshotShell>
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
    if (featureId === 'confirm') return <ClinicConfirmVisual />;
    if (featureId === 'match') return <ClinicMatchVisual />;
    return <MessagingVisual audience="clinic" />;
  }
  if (featureId === 'availability') return <ProfessionalAvailabilityVisual />;
  if (featureId === 'alerts') return <ProfessionalAlertsVisual />;
  return <MessagingVisual audience="professional" />;
}

function HighlightTitle({
  title,
  highlight,
  accent,
  lead,
}: {
  title: string;
  highlight: string;
  accent: GradientAccent;
  lead?: boolean;
}) {
  const { colors } = useTheme();
  const accentColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const fontSize = lead ? 19 : 18;
  const lineHeight = lead ? 25 : 24;

  if (!title.includes(highlight)) {
    return (
      <Text style={{ fontSize, lineHeight, fontWeight: '700', color: colors.labelPrimary }}>
        {title}
      </Text>
    );
  }

  const [before, after] = title.split(highlight);
  return (
    <Text style={{ fontSize, lineHeight, fontWeight: '700', color: colors.labelPrimary }}>
      {before}
      <Text style={{ color: accentColor }}>{highlight}</Text>
      {after}
    </Text>
  );
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
  const { isDark } = useTheme();
  const { liftStyle, hoverHandlers } = useWebCardLift(isDark);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      flex: 1,
      borderRadius: 20,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.md,
      minHeight: feature.lead ? 248 : 220,
      ...webCardLiftBase(),
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
    copy: {
      gap: 4,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    visual: {
      flex: 1,
      justifyContent: 'center' as const,
      minHeight: feature.lead ? 112 : 96,
    },
  }));

  return (
    <WebPageEnter delayMs={enterDelayMs} style={{ flex: 1 }} trigger="visible">
      <View style={[styles.card, liftStyle]} {...hoverHandlers}>
        <View style={styles.copy}>
          <HighlightTitle
            title={feature.title}
            highlight={feature.highlight}
            accent={feature.accent}
            lead={feature.lead}
          />
          <Text style={styles.body}>{feature.body}</Text>
        </View>
        <View style={styles.visual}>
          <FeatureVisual audience={audience} featureId={feature.id} />
        </View>
      </View>
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
      gap: spacing.md,
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
          ? 'radial-gradient(ellipse 70% 55% at 12% 18%, rgba(152, 150, 255, 0.16) 0%, transparent 58%), radial-gradient(ellipse 55% 45% at 88% 8%, rgba(74, 154, 255, 0.12) 0%, transparent 55%)'
          : 'radial-gradient(ellipse 70% 55% at 12% 18%, rgba(88, 86, 214, 0.1) 0%, transparent 58%), radial-gradient(ellipse 55% 45% at 88% 8%, rgba(26, 111, 212, 0.08) 0%, transparent 55%)',
      } as object),
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
      maxWidth: 560,
    },
    eyebrow: webSectionEyebrowStyle(colors),
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...webTypography.subtitle,
      fontSize: 17,
      color: colors.labelSecondary,
      marginTop: spacing.xs,
    },
  }));

  return (
    <WebMarketingSection
      style={styles.bleed}
      sectionId="features"
      atmosphere={<View style={styles.atmosphere} />}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Features</Text>
        <Text style={styles.title}>Built for how dental teams actually work</Text>
        <Text style={styles.subtitle}>{AUDIENCE_SUBTITLE[audience]}</Text>
      </View>

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
