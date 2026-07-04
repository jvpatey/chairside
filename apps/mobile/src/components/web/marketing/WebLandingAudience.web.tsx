import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, Text, type TextStyle, View } from 'react-native';

import { ChairsideBrandText } from '@/components/brand/ChairsideWordmark';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import {
  webHover,
  webLinkUnderline,
  webOnlyStyle,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
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
    points: ['Post roles and same-day fill-ins', 'Screen, message, and hire in one place'],
    cta: 'Start hiring',
  },
  {
    id: 'worker',
    icon: 'medical-outline' as const,
    accent: 'secondary' as const,
    title: 'For professionals',
    subtitle: 'Find work on your terms',
    points: ['Browse shifts and apply in one tap', 'Signal availability and get discovered'],
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
  const { colors } = useTheme();
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
      alignItems: 'center' as const,
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
      gap: 0,
      flex: 1,
    },
    point: {
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    pointFirst: {
      borderTopWidth: 0,
      paddingTop: 0,
    },
    pointText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
    link: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      alignSelf: 'flex-start' as const,
      gap: 6,
      marginTop: 'auto' as const,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      marginLeft: -spacing.sm,
      borderRadius: 8,
      ...webPointer(),
    },
    linkLabel: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600' as const,
      color: tint,
    },
  }));

  return (
    <View style={styles.panel}>
      <View style={styles.atmosphere} />
      <View style={styles.content}>
        <View style={styles.top}>
          <Ionicons name={audience.icon} size={22} color={tint} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>{audience.title}</Text>
            <Text style={styles.subtitle}>{audience.subtitle}</Text>
          </View>
        </View>

        <View style={styles.points}>
          {audience.points.map((point, index) => (
            <View key={point} style={[styles.point, index === 0 && styles.pointFirst]}>
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(ONBOARDING_HREF)}
          style={({ pressed, hovered }) => [
            styles.link,
            webHover(hovered, pressed, webTextLinkHoverStyles(colors)),
            pressed && { opacity: 0.85 },
          ]}
        >
          {({ hovered }) => (
            <>
              <Text style={[styles.linkLabel, webLinkUnderline(hovered, tint) as TextStyle]}>
                {audience.cta}
              </Text>
              <Ionicons name="arrow-forward" size={15} color={tint} />
            </>
          )}
        </Pressable>
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
      width: compact ? ('100%' as const) : 112,
      flexShrink: 0,
      paddingVertical: compact ? spacing.md : 0,
      position: 'relative' as const,
      alignSelf: 'center' as const,
      zIndex: 2,
    },
    glow: {
      position: 'absolute' as const,
      width: ringSize + 44,
      height: ringSize + 44,
      borderRadius: 999,
      pointerEvents: 'none' as const,
      zIndex: 0,
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
    below: {
      alignItems: 'center' as const,
      marginTop: spacing.sm,
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
  }));

  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel="Chairside — one platform">
      <View style={styles.glow} />
      <View style={styles.ring}>
        <ChairsideBrandText variant="small" />
      </View>
      {compact ? (
        <View style={styles.below}>
          <Text style={styles.tagline}>Same platform · different goals</Text>
        </View>
      ) : null}
    </View>
  );
}

function AudienceConnector({ side }: { side: 'left' | 'right' }) {
  const styles = useThemedStyles(({ spacing, isDark }) => ({
    slot: {
      width: spacing.lg,
      alignSelf: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
      zIndex: 0,
    },
    line: {
      height: 2,
      width: '100%' as const,
      borderRadius: 1,
      ...webOnlyStyle({
        backgroundImage:
          side === 'left'
            ? isDark
              ? 'linear-gradient(90deg, transparent 0%, rgba(74, 154, 255, 0.55) 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(26, 111, 212, 0.45) 100%)'
            : isDark
              ? 'linear-gradient(90deg, rgba(152, 150, 255, 0.55) 0%, transparent 100%)'
              : 'linear-gradient(90deg, rgba(88, 86, 214, 0.45) 0%, transparent 100%)',
      } as object),
    },
  }));

  return (
    <View style={styles.slot} pointerEvents="none">
      <View style={styles.line} />
    </View>
  );
}

function AudienceGrid() {
  const { isWide } = useResponsiveLayout();
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'stretch' as const,
    },
    stack: {
      gap: spacing.lg,
    },
  }));

  if (!isWide) {
    return (
      <View style={styles.stack}>
        <WebPageEnter delayMs={0}>
          <AudienceBridge compact />
        </WebPageEnter>
        {AUDIENCES.map((audience, index) => (
          <WebPageEnter key={audience.id} delayMs={80 + index * 80}>
            <AudiencePanel audience={audience} />
          </WebPageEnter>
        ))}
      </View>
    );
  }

  const [clinic, worker] = AUDIENCES;

  return (
    <View style={styles.row}>
      <WebPageEnter delayMs={0} style={{ flex: 1, minWidth: 0, alignSelf: 'stretch' }}>
        <AudiencePanel audience={clinic} />
      </WebPageEnter>
      <AudienceConnector side="left" />
      <WebPageEnter delayMs={80} style={{ alignSelf: 'center' }}>
        <AudienceBridge />
      </WebPageEnter>
      <AudienceConnector side="right" />
      <WebPageEnter delayMs={160} style={{ flex: 1, minWidth: 0, alignSelf: 'stretch' }}>
        <AudiencePanel audience={worker} />
      </WebPageEnter>
    </View>
  );
}

export function WebLandingAudience() {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl * 2.5,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      position: 'relative' as const,
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
    inner: {
      position: 'relative' as const,
      zIndex: 1,
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
    subtitle: {
      ...webTypography.subtitle,
      fontSize: 17,
      lineHeight: 26,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
      maxWidth: 480,
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.atmosphere} />
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Built for both sides</Text>
          <Text style={styles.title}>One platform, two audiences</Text>
        </View>

        <AudienceGrid />
      </View>
    </View>
  );
}
