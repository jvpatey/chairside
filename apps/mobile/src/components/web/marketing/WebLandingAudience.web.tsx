import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { ChairsideBrandText } from '@/components/brand/ChairsideWordmark';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ApplicantAvatarStack } from '@/components/ui/ApplicantAvatarStack';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { PillBadge } from '@/components/ui/PillBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { WebMarketingSection } from '@/components/web/marketing/WebMarketingSection.web';
import {
  getWelcomeHeroPreview,
  type WelcomeHeroPreview,
} from '@/lib/welcomeHeroPreview';
import { webOnlyStyle, useWebCardLift } from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webSectionEyebrowStyle, webTypography } from '@/theme/web';

const ONBOARDING_HREF = '/(onboarding)/role' as Href;

const AUDIENCES = [
  {
    id: 'clinic',
    accent: 'primary' as const,
    title: 'Clinics',
    subtitle: 'Fill chairs faster',
    points: ['Post roles and same-day fill-ins', 'Screen, message, and hire in one place'],
    cta: 'Start hiring',
  },
  {
    id: 'worker',
    accent: 'secondary' as const,
    title: 'Professionals',
    subtitle: 'Find work on your terms',
    badge: 'Always free',
    points: ['Browse roles and fill-ins', 'Signal availability and get discovered'],
    cta: 'Find work',
  },
] as const;

type Audience = (typeof AUDIENCES)[number];
type Accent = Audience['accent'];

function panelGlow(accent: Accent, isDark: boolean) {
  const origin = accent === 'primary' ? '12% 0%' : '88% 0%';
  const color =
    accent === 'primary'
      ? isDark
        ? 'rgba(74, 154, 255, 0.22)'
        : 'rgba(26, 111, 212, 0.14)'
      : isDark
        ? 'rgba(152, 150, 255, 0.22)'
        : 'rgba(88, 86, 214, 0.14)';

  return webOnlyStyle({
    backgroundImage: `radial-gradient(ellipse 90% 70% at ${origin}, ${color} 0%, transparent 68%)`,
  } as object);
}

/** Clinic POV: reviewing applicants — not another listing card. */
function ClinicHiringSnapshot({ preview }: { preview: WelcomeHeroPreview }) {
  const applicants = preview.applicants.slice(0, 2);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    overline: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    title: {
      fontSize: 17,
      lineHeight: 22,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    headerTrailing: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      flexShrink: 0,
    },
    list: {
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
    },
    name: {
      flex: 1,
      minWidth: 0,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
  }));

  return (
    <View accessibilityLabel="Clinic preview: reviewing applicants for Dental Hygienist">
      <SurfaceCard variant="inner" padding="md">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.overline}>New applicants</Text>
            <Text style={styles.title} numberOfLines={1}>
              {preview.job.title}
            </Text>
          </View>
          <View style={styles.headerTrailing}>
            <ApplicantAvatarStack names={applicants.map((a) => a.name)} size={28} />
            <JobPostStatusBadge status={preview.job.status} />
          </View>
        </View>
        <View style={styles.list}>
          {applicants.map((applicant) => (
            <View key={applicant.id} style={styles.row}>
              <WorkerProfileAvatar displayName={applicant.name} size={32} />
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
          ))}
        </View>
      </SurfaceCard>
    </View>
  );
}

function AudienceProductSnapshot({ audience }: { audience: Audience }) {
  const preview = useMemo(() => getWelcomeHeroPreview(), []);
  const workerMatch = preview.applicants[0];

  if (audience.id === 'clinic') {
    return <ClinicHiringSnapshot preview={preview} />;
  }

  return (
    <RoleListingCard
      job={preview.job}
      embedded
      jobMatch={workerMatch.match}
      matchContext={workerMatch.matchContext}
      distanceLabel={preview.fillInDistanceLabel}
    />
  );
}

function AudiencePanel({ audience }: { audience: Audience }) {
  const { colors, isDark } = useTheme();
  const { liftStyle, hoverHandlers } = useWebCardLift(isDark);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    panel: {
      flex: 1,
      minWidth: 0,
      borderRadius: 28,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
      position: 'relative' as const,
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'raised') } as object),
    },
    atmosphere: {
      ...webOnlyStyle({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        ...panelGlow(audience.accent, isDark),
      } as object),
    },
    content: {
      flex: 1,
      gap: spacing.lg,
      zIndex: 1,
    },
    header: {
      gap: spacing.sm,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...webTypography.bodyLg,
      color: colors.labelSecondary,
    },
    points: {
      gap: spacing.sm,
    },
    point: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.labelSecondary,
      paddingLeft: spacing.md,
      borderLeftWidth: 2,
      borderLeftColor:
        audience.accent === 'primary' ? colors.primary : colors.secondary,
    },
    snapshot: {
      width: '100%' as const,
      marginTop: spacing.xs,
    },
    cta: {
      alignSelf: 'stretch' as const,
    },
  }));

  return (
    <View style={[styles.panel, liftStyle]} {...hoverHandlers}>
      <View style={styles.atmosphere} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{audience.title}</Text>
            {'badge' in audience && audience.badge ? (
              <PillBadge
                label={audience.badge}
                color={colors.tertiary}
                backgroundColor={colors.tertiarySubtle}
                size="sm"
              />
            ) : null}
          </View>
          <Text style={styles.subtitle}>{audience.subtitle}</Text>
        </View>

        <View style={styles.points}>
          {audience.points.map((point) => (
            <Text key={point} style={styles.point}>
              {point}
            </Text>
          ))}
        </View>

        <OnboardingButton
          label={audience.cta}
          onPress={() => router.push(ONBOARDING_HREF)}
          variant={audience.accent === 'primary' ? 'primary' : 'secondary'}
          accent={audience.accent}
          style={styles.cta}
        />

        <View style={styles.snapshot} pointerEvents="box-none">
          <AudienceProductSnapshot audience={audience} />
        </View>
      </View>
    </View>
  );
}

function AudienceBrandSeam({ horizontal }: { horizontal?: boolean }) {
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    wrap: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      alignSelf: horizontal ? ('stretch' as const) : ('center' as const),
      width: horizontal ? ('100%' as const) : 120,
      flexShrink: 0,
      paddingVertical: horizontal ? spacing.lg : spacing.md,
      paddingHorizontal: horizontal ? spacing.md : spacing.sm,
      gap: spacing.sm,
      position: 'relative' as const,
    },
    glow: {
      position: 'absolute' as const,
      width: horizontal ? '70%' : 140,
      height: horizontal ? 80 : '70%',
      borderRadius: 999,
      pointerEvents: 'none' as const,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'radial-gradient(ellipse at center, rgba(74, 154, 255, 0.16) 0%, rgba(152, 150, 255, 0.1) 42%, transparent 72%)'
          : 'radial-gradient(ellipse at center, rgba(26, 111, 212, 0.12) 0%, rgba(88, 86, 214, 0.08) 42%, transparent 72%)',
      } as object),
    },
    rule: {
      ...(horizontal
        ? {
            width: '100%' as const,
            height: 1,
            maxWidth: 220,
          }
        : {
            width: 1,
            height: 48,
          }),
      backgroundColor: colors.separator,
    },
    brand: {
      zIndex: 1,
    },
    tagline: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
      textAlign: 'center' as const,
      zIndex: 1,
    },
  }));

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel="Chairside — one platform"
    >
      <View style={styles.glow} />
      <View style={styles.rule} />
      <View style={styles.brand}>
        <ChairsideBrandText variant="small" />
      </View>
      <Text style={styles.tagline}>One platform</Text>
      <View style={styles.rule} />
    </View>
  );
}

function AudienceGrid() {
  const { isWide } = useResponsiveLayout();
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'stretch' as const,
      gap: spacing.md,
    },
    stack: {
      gap: spacing.md,
    },
  }));

  const [clinic, worker] = AUDIENCES;

  if (!isWide) {
    return (
      <View style={styles.stack}>
        <WebPageEnter delayMs={0} trigger="visible">
          <AudiencePanel audience={clinic} />
        </WebPageEnter>
        <WebPageEnter delayMs={80} trigger="visible">
          <AudienceBrandSeam horizontal />
        </WebPageEnter>
        <WebPageEnter delayMs={160} trigger="visible">
          <AudiencePanel audience={worker} />
        </WebPageEnter>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <WebPageEnter
        delayMs={0}
        style={{ flex: 1, minWidth: 0, alignSelf: 'stretch' }}
        trigger="visible"
      >
        <AudiencePanel audience={clinic} />
      </WebPageEnter>
      <WebPageEnter delayMs={80} style={{ alignSelf: 'center' }} trigger="visible">
        <AudienceBrandSeam />
      </WebPageEnter>
      <WebPageEnter
        delayMs={160}
        style={{ flex: 1, minWidth: 0, alignSelf: 'stretch' }}
        trigger="visible"
      >
        <AudiencePanel audience={worker} />
      </WebPageEnter>
    </View>
  );
}

export function WebLandingAudience() {
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    bleed: {
      paddingVertical: spacing.xl * 2.5,
      overflow: 'hidden' as const,
    },
    atmosphere: {
      ...webOnlyStyle({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 50% 45% at 15% 55%, rgba(74, 154, 255, 0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 85% 55%, rgba(152, 150, 255, 0.08) 0%, transparent 60%)'
          : 'radial-gradient(ellipse 50% 45% at 15% 55%, rgba(26, 111, 212, 0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 85% 55%, rgba(88, 86, 214, 0.06) 0%, transparent 60%)',
      } as object),
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xl + spacing.sm,
      alignItems: 'center' as const,
      maxWidth: 560,
      alignSelf: 'center' as const,
    },
    eyebrow: webSectionEyebrowStyle(colors),
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
      textAlign: 'center' as const,
    },
  }));

  return (
    <WebMarketingSection style={styles.bleed} atmosphere={<View style={styles.atmosphere} />}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Built for both sides</Text>
        <Text style={styles.title}>Built for clinics and professionals</Text>
      </View>

      <AudienceGrid />
    </WebMarketingSection>
  );
}
