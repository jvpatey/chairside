import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webSectionEyebrowStyle, webTypography } from '@/theme/web';

const STEPS = [
  {
    number: '01',
    icon: 'person-circle-outline' as const,
    title: 'Create your profile',
    body: 'Clinics set up their practice. Professionals build an application kit once — credentials, skills, and availability.',
  },
  {
    number: '02',
    icon: 'briefcase-outline' as const,
    title: 'Post or browse',
    body: 'Clinics post roles and fill-ins. Professionals browse matches, apply in one tap, or signal they’re available.',
  },
  {
    number: '03',
    icon: 'chatbubbles-outline' as const,
    title: 'Connect and hire',
    body: 'Message, schedule interviews, and close the loop — all without leaving Chairside.',
  },
] as const;

const CONNECTOR_THICKNESS = 4;
const NODE_SIZE = 56;

function connectorGradient(isDark: boolean, direction: '90deg' | '180deg') {
  return isDark
    ? `linear-gradient(${direction}, rgba(74, 154, 255, 0.65) 0%, rgba(152, 150, 255, 0.5) 100%)`
    : `linear-gradient(${direction}, rgba(26, 111, 212, 0.55) 0%, rgba(88, 86, 214, 0.4) 100%)`;
}

function StepConnector({ horizontal }: { horizontal: boolean }) {
  const styles = useThemedStyles(({ isDark }) => ({
    horizontal: {
      flex: 1,
      height: CONNECTOR_THICKNESS,
      minWidth: 32,
      alignSelf: 'center' as const,
      // @ts-expect-error web gradient
      backgroundImage: connectorGradient(isDark, '90deg'),
      borderRadius: CONNECTOR_THICKNESS / 2,
    },
    vertical: {
      width: CONNECTOR_THICKNESS,
      flex: 1,
      minHeight: 36,
      alignSelf: 'center' as const,
      // @ts-expect-error web gradient
      backgroundImage: connectorGradient(isDark, '180deg'),
      borderRadius: CONNECTOR_THICKNESS / 2,
    },
  }));

  return <View style={horizontal ? styles.horizontal : styles.vertical} />;
}

function StepNode({ number, icon }: { number: string; icon: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, isDark }) => ({
    ring: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
    number: {
      position: 'absolute' as const,
      top: -10,
      right: -6,
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
      color: colors.primaryOnPrimary,
      backgroundColor: colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      overflow: 'hidden' as const,
    },
  }));

  return (
    <View style={styles.ring}>
      <Text style={styles.number}>{number}</Text>
      <Ionicons name={icon} size={24} color={colors.primary} />
    </View>
  );
}

function StepContentCard({
  step,
  enterDelayMs,
}: {
  step: (typeof STEPS)[number];
  enterDelayMs?: number;
}) {
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      flex: 1,
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      minHeight: 148,
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
    title: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebPageEnter delayMs={enterDelayMs} style={{ flex: 1, minWidth: 0 }}>
      <View style={styles.card}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
      </View>
    </WebPageEnter>
  );
}

function DesktopTimeline() {
  const styles = useThemedStyles(({ spacing, isDark }) => {
    const gap = spacing.lg;
    const columnWidth = `(100% - ${2 * gap}px) / 3`;
    const connectorTop = (NODE_SIZE - CONNECTOR_THICKNESS) / 2;
    const connectorBase = {
      position: 'absolute' as const,
      top: connectorTop,
      height: CONNECTOR_THICKNESS,
      borderRadius: CONNECTOR_THICKNESS / 2,
      zIndex: 0,
      ...webOnlyStyle({
        backgroundImage: connectorGradient(isDark, '90deg'),
      } as object),
    };

    return {
      nodeTrack: {
        flexDirection: 'row' as const,
        gap,
        position: 'relative' as const,
        marginBottom: spacing.md,
      },
      nodeSlot: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center' as const,
        zIndex: 1,
      },
      connectorFirst: {
        ...connectorBase,
        ...webOnlyStyle({
          left: `calc(${columnWidth} / 2)`,
          width: `calc(${columnWidth} + ${gap}px)`,
        } as object),
      },
      connectorSecond: {
        ...connectorBase,
        ...webOnlyStyle({
          left: `calc((${columnWidth} * 1.5) + ${gap}px)`,
          width: `calc(${columnWidth} + ${gap}px)`,
        } as object),
      },
      cardTrack: {
        flexDirection: 'row' as const,
        gap,
        alignItems: 'stretch' as const,
      },
      cardSlot: {
        flex: 1,
        minWidth: 0,
      },
    };
  });

  return (
    <>
      <View style={styles.nodeTrack}>
        <View style={styles.connectorFirst} />
        <View style={styles.connectorSecond} />
        {STEPS.map((step, index) => (
          <View key={step.number} style={styles.nodeSlot}>
            <WebPageEnter delayMs={index * 80}>
              <StepNode number={step.number} icon={step.icon} />
            </WebPageEnter>
          </View>
        ))}
      </View>

      <View style={styles.cardTrack}>
        {STEPS.map((step, index) => (
          <View key={step.number} style={styles.cardSlot}>
            <StepContentCard step={step} enterDelayMs={120 + index * 80} />
          </View>
        ))}
      </View>
    </>
  );
}

function MobileTimeline() {
  const styles = useThemedStyles(({ spacing }) => ({
    step: {
      flexDirection: 'row' as const,
      gap: spacing.lg,
    },
    rail: {
      width: 56,
      alignItems: 'center' as const,
    },
    content: {
      flex: 1,
      minWidth: 0,
      paddingBottom: spacing.lg,
    },
  }));

  return (
    <View>
      {STEPS.map((step, index) => (
        <View key={step.number} style={styles.step}>
          <View style={styles.rail}>
            <WebPageEnter delayMs={index * 80}>
              <StepNode number={step.number} icon={step.icon} />
            </WebPageEnter>
            {index < STEPS.length - 1 ? <StepConnector horizontal={false} /> : null}
          </View>
          <View style={styles.content}>
            <StepContentCard step={step} enterDelayMs={120 + index * 80} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function WebLandingHowItWorks() {
  const { colors } = useTheme();
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl * 2,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xl,
      maxWidth: 480,
    },
    eyebrow: webSectionEyebrowStyle(colors),
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...webTypography.subtitle,
      fontSize: 17,
      lineHeight: 26,
      color: colors.labelSecondary,
      marginTop: spacing.xs,
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>How it works</Text>
        <Text style={styles.title}>Three steps to get started</Text>
        <Text style={styles.subtitle}>
          From first profile to first hire — Chairside keeps the whole workflow in one place.
        </Text>
      </View>

      {isWide ? <DesktopTimeline /> : <MobileTimeline />}
    </View>
  );
}
