import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { ChairsideBrandText } from '@/components/brand/ChairsideWordmark';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { PillBadge } from '@/components/ui/PillBadge';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { WebMarketingSection } from '@/components/web/marketing/WebMarketingSection.web';
import { webOnlyStyle, useWebCardLift } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webGlassSurface, webSectionEyebrowStyle, webTypography } from '@/theme/web';

const HUB_RING_SIZE = 76;
const HUB_RING_SIZE_COMPACT = 88;

const ONBOARDING_HREF = '/(onboarding)/role' as Href;

const AUDIENCES = [
  {
    id: 'clinic',
    icon: 'business-outline' as const,
    accent: 'primary' as const,
    title: 'For clinics',
    subtitle: 'Fill chairs faster',
    points: [
      'Post roles and same-day fill-ins',
      'Screen, message, and hire in one place',
      'Single clinic or multi-location group',
    ],
    cta: 'Start hiring',
  },
  {
    id: 'worker',
    icon: 'medical-outline' as const,
    accent: 'secondary' as const,
    title: 'For professionals',
    subtitle: 'Find work on your terms',
    badge: 'Always free',
    points: [
      'Browse permanent roles and fill-in shifts',
      'Signal availability and get discovered',
      'Get alerts when nearby shifts open',
    ],
    cta: 'Find work',
  },
] as const;

type Audience = (typeof AUDIENCES)[number];
type Accent = Audience['accent'];

function accentColor(accent: Accent, colors: ReturnType<typeof useTheme>['colors']) {
  return accent === 'primary' ? colors.primary : colors.secondary;
}

function panelGlow(accent: Accent, isDark: boolean) {
  const origin = accent === 'primary' ? '0% 0%' : '100% 0%';
  const color =
    accent === 'primary'
      ? isDark
        ? 'rgba(74, 154, 255, 0.18)'
        : 'rgba(26, 111, 212, 0.12)'
      : isDark
        ? 'rgba(152, 150, 255, 0.18)'
        : 'rgba(88, 86, 214, 0.12)';

  return webOnlyStyle({
    backgroundImage: `radial-gradient(ellipse 85% 65% at ${origin}, ${color} 0%, transparent 62%)`,
  } as object);
}

function AudiencePanel({ audience }: { audience: Audience }) {
  const { colors, isDark } = useTheme();
  const { liftStyle, hoverHandlers } = useWebCardLift(isDark);
  const tint = accentColor(audience.accent, colors);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    panel: {
      flex: 1,
      minWidth: 0,
      borderRadius: 20,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
      position: 'relative' as const,
      zIndex: 1,
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
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
    top: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
    },
    iconWrap: {
      marginTop: 2,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    title: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
      marginTop: 2,
    },
    points: {
      gap: spacing.sm,
      flex: 1,
    },
    point: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      alignItems: 'flex-start' as const,
    },
    pointText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
    cta: {
      alignSelf: 'stretch' as const,
      marginTop: 'auto' as const,
    },
  }));

  return (
    <View style={[styles.panel, liftStyle]} {...hoverHandlers}>
      <View style={styles.atmosphere} />
      <View style={styles.content}>
        <View style={styles.top}>
          <View style={styles.iconWrap}>
            <Ionicons name={audience.icon} size={22} color={tint} />
          </View>
          <View style={styles.headerText}>
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
        </View>

        <View style={styles.points}>
          {audience.points.map((point) => (
            <View key={point} style={styles.point}>
              <Ionicons name="checkmark-circle" size={17} color={tint} style={{ marginTop: 2 }} />
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>

        <OnboardingButton
          label={audience.cta}
          onPress={() => router.push(ONBOARDING_HREF)}
          variant={audience.accent === 'primary' ? 'primary' : 'secondary'}
          accent={audience.accent}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

function AudienceBridge({ compact }: { compact?: boolean }) {
  const ringSize = compact ? HUB_RING_SIZE_COMPACT : HUB_RING_SIZE;

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    wrap: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      alignSelf: 'center' as const,
      width: compact ? ('100%' as const) : 168,
      flexShrink: 0,
      paddingVertical: compact ? spacing.md : spacing.lg,
      paddingHorizontal: compact ? 0 : spacing.sm,
      gap: spacing.sm,
    },
    ringCluster: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      width: ringSize,
      height: ringSize,
      position: 'relative' as const,
    },
    glow: {
      position: 'absolute' as const,
      width: ringSize + 44,
      height: ringSize + 44,
      borderRadius: 999,
      pointerEvents: 'none' as const,
      top: -22,
      left: -22,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'radial-gradient(circle, rgba(74, 154, 255, 0.22) 0%, rgba(152, 150, 255, 0.1) 45%, transparent 70%)'
          : 'radial-gradient(circle, rgba(26, 111, 212, 0.14) 0%, rgba(88, 86, 214, 0.08) 45%, transparent 70%)',
      } as object),
    },
    ring: {
      width: ringSize,
      height: ringSize,
      borderRadius: ringSize / 2,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.sm,
      zIndex: 1,
      ...webGlassSurface(colors, isDark),
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'floating') } as object),
    },
    copy: {
      alignItems: 'center' as const,
      gap: 4,
      maxWidth: compact ? 280 : 168,
    },
    tagline: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
      textAlign: 'center' as const,
    },
    sublabel: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
    },
  }));

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel="Chairside — one platform. Clinics hire, professionals join free.">
      <View style={styles.ringCluster}>
        <View style={styles.glow} />
        <View style={styles.ring}>
          <ChairsideBrandText variant="small" />
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.tagline}>One platform</Text>
        <Text style={styles.sublabel}>Clinics hire · Professionals join free</Text>
      </View>
    </View>
  );
}

function AudienceGrid() {
  const { isWide } = useResponsiveLayout();
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'stretch' as const,
      gap: spacing.lg,
    },
    stack: {
      gap: spacing.lg,
    },
  }));

  if (!isWide) {
    return (
      <View style={styles.stack}>
        <WebPageEnter delayMs={0} trigger="visible">
          <AudienceBridge compact />
        </WebPageEnter>
        {AUDIENCES.map((audience, index) => (
          <WebPageEnter key={audience.id} delayMs={80 + index * 80} trigger="visible">
            <AudiencePanel audience={audience} />
          </WebPageEnter>
        ))}
      </View>
    );
  }

  const [clinic, worker] = AUDIENCES;

  return (
    <View style={styles.row}>
      <WebPageEnter delayMs={0} style={{ flex: 1, minWidth: 0, alignSelf: 'stretch' }} trigger="visible">
        <AudiencePanel audience={clinic} />
      </WebPageEnter>
      <WebPageEnter delayMs={80} style={{ alignSelf: 'center' }} trigger="visible">
        <AudienceBridge />
      </WebPageEnter>
      <WebPageEnter delayMs={160} style={{ flex: 1, minWidth: 0, alignSelf: 'stretch' }} trigger="visible">
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
      marginBottom: spacing.xl,
      alignItems: 'center' as const,
    },
    eyebrow: webSectionEyebrowStyle(colors),
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
      textAlign: 'center' as const,
    },
  }));

  return (
    <WebMarketingSection
      style={styles.bleed}
      atmosphere={<View style={styles.atmosphere} />}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Built for both sides</Text>
        <Text style={styles.title}>Built for clinics and professionals</Text>
      </View>

      <AudienceGrid />
    </WebMarketingSection>
  );
}
