import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import {
  WelcomeSmsPreview,
  WELCOME_SMS_REPLY_CODE,
} from '@/components/web/marketing/WelcomeSmsPreview.web';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webMotion } from '@/theme/web';

type FlowPhase = 'post' | 'sms' | 'covered';

const PHASES: FlowPhase[] = ['post', 'sms', 'covered'];

/** Readable beats with room for crossfade (~480ms). */
const PHASE_AT_MS = [0, 2600, 5400] as const;
const CYCLE_MS = 8600;

/** Settled beat when motion is reduced — SMS / Reply YES is the product idea. */
const REDUCED_MOTION_PHASE: FlowPhase = 'sms';

const PHONE_WIDTH = 300;
const PHONE_HEIGHT = 580;
const DESKTOP_SCALE = 0.92;
const MOBILE_SCALE = 0.72;

const BEAT_LABEL: Record<FlowPhase, string> = {
  post: 'Clinic posts a fill-in',
  sms: 'Professionals get a text — Reply YES',
  covered: 'Clinic confirms cover',
};

const CROSSFADE = `opacity 480ms ${webMotion.easingOut}, transform 480ms ${webMotion.easingOut}`;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function phaseStyle(visible: boolean, offsetY = 12) {
  return webOnlyStyle({
    opacity: visible ? 1 : 0,
    transform: [{ translateY: visible ? 0 : offsetY }, { scale: visible ? 1 : 0.98 }],
    transition: CROSSFADE,
    pointerEvents: visible ? 'auto' : 'none',
  } as object);
}

function useHeroFlowLoop(enabled: boolean): FlowPhase {
  const [phase, setPhase] = useState<FlowPhase>(REDUCED_MOTION_PHASE);

  useEffect(() => {
    if (!enabled || prefersReducedMotion() || typeof window === 'undefined') {
      setPhase(REDUCED_MOTION_PHASE);
      return;
    }

    let timers: number[] = [];
    const run = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = PHASE_AT_MS.map((atMs, index) =>
        window.setTimeout(() => setPhase(PHASES[index] ?? 'sms'), atMs),
      );
    };

    run();
    const interval = window.setInterval(run, CYCLE_MS);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(interval);
    };
  }, [enabled]);

  return phase;
}

function PostScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.secondarySubtle,
    },
    title: {
      flex: 1,
      fontSize: 15,
      fontFamily: fontSemibold,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
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
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    valueAccent: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.secondary,
    },
    posted: {
      marginTop: 4,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      alignSelf: 'flex-start' as const,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.secondarySubtle,
    },
    postedText: {
      fontSize: 13,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.secondary,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name={FILL_IN_ICON.filled} size={18} color={colors.secondary} />
        </View>
        <Text style={styles.title}>New fill-in</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>Dental Hygienist</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>When</Text>
        <Text style={styles.valueAccent}>Today · 9–5</Text>
      </View>
      <View style={styles.posted}>
        <Ionicons name="checkmark-circle" size={14} color={colors.secondary} />
        <Text style={styles.postedText}>Posted — texts sent</Text>
      </View>
    </View>
  );
}

function SmsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    stack: {
      gap: spacing.md,
      width: '100%' as const,
    },
    suggestion: {
      alignSelf: 'flex-start' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.secondary,
      backgroundColor: isDark ? 'rgba(74, 154, 255, 0.2)' : 'rgba(26, 111, 212, 0.12)',
      ...webOnlyStyle({
        boxShadow: isDark
          ? '0 0 28px rgba(74, 154, 255, 0.4)'
          : '0 0 22px rgba(26, 111, 212, 0.28)',
      } as object),
    },
    suggestionText: {
      fontSize: 13,
      fontFamily: fontSemibold,
      fontWeight: '700' as const,
      color: colors.secondary,
      letterSpacing: 0.3,
    },
  }));

  return (
    <View style={styles.stack}>
      <WelcomeSmsPreview size="default" />
      <View style={styles.suggestion}>
        <Ionicons name="return-down-back" size={15} color={colors.secondary} />
        <Text style={styles.suggestionText}>YES {WELCOME_SMS_REPLY_CODE}</Text>
      </View>
    </View>
  );
}

function CoveredScreen() {
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.tertiary,
      padding: spacing.md,
      gap: spacing.sm,
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.tertiary,
    },
    body: { flex: 1, minWidth: 0, gap: 2 },
    title: {
      fontSize: 16,
      fontFamily: fontSemibold,
      fontWeight: '700' as const,
      color: colors.tertiary,
    },
    detail: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Cover confirmed</Text>
          <Text style={styles.detail}>
            They replied YES — you picked the right match for Today · 9–5.
          </Text>
        </View>
      </View>
    </View>
  );
}

type WelcomeHeroFlowPhoneProps = {
  /** Larger scale for desktop hero; compact for mobile web. */
  size?: 'default' | 'hero';
};

/** Phone-framed SMS-forward hero demo: post → Reply YES → covered. */
export function WelcomeHeroFlowPhone({ size = 'hero' }: WelcomeHeroFlowPhoneProps) {
  const { colors } = useTheme();
  const isHero = size === 'hero';
  const scale = isHero ? DESKTOP_SCALE : MOBILE_SCALE;
  const frameWidth = PHONE_WIDTH * scale;
  const frameHeight = PHONE_HEIGHT * scale;
  const phase = useHeroFlowLoop(true);
  const beatIndex = useMemo(() => PHASES.indexOf(phase), [phase]);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    stage: {
      width: frameWidth,
      alignSelf: 'center' as const,
      alignItems: 'center' as const,
      position: 'relative' as const,
      gap: spacing.md,
    },
    glow: {
      position: 'absolute' as const,
      top: '4%',
      left: '-8%',
      right: '-8%',
      bottom: '18%',
      borderRadius: 999,
      pointerEvents: 'none' as const,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'radial-gradient(ellipse at 45% 35%, rgba(74, 154, 255, 0.42) 0%, transparent 60%), radial-gradient(ellipse at 70% 75%, rgba(59, 138, 232, 0.22) 0%, transparent 55%)'
          : 'radial-gradient(ellipse at 45% 35%, rgba(26, 111, 212, 0.28) 0%, transparent 60%), radial-gradient(ellipse at 70% 75%, rgba(59, 138, 232, 0.16) 0%, transparent 55%)',
      } as object),
    },
    frame: {
      width: frameWidth,
      height: frameHeight,
      borderRadius: 44 * scale,
      ...webOnlyStyle({
        boxShadow: getWebShadow(isDark, 'hero'),
      } as object),
    },
    clip: {
      width: '100%' as const,
      height: '100%' as const,
      borderRadius: 44 * scale,
      overflow: 'hidden' as const,
      ...webOnlyStyle({
        clipPath: `inset(0 round ${44 * scale}px)`,
      } as object),
    },
    scaled: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: PHONE_WIDTH,
      height: PHONE_HEIGHT,
    },
    device: {
      flex: 1,
      borderRadius: 44,
      padding: 11,
      backgroundColor: isDark ? '#0B0D12' : '#1C1C1E',
    },
    screen: {
      flex: 1,
      borderRadius: 34,
      overflow: 'hidden' as const,
      backgroundColor: colors.backgroundGrouped,
      position: 'relative' as const,
      ...webOnlyStyle({
        clipPath: 'inset(0 round 34px)',
      } as object),
    },
    statusBar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.md + 4,
      paddingTop: 14,
      height: 52,
    },
    statusTime: {
      fontSize: 15,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    islandWrap: {
      position: 'absolute' as const,
      top: 11,
      left: 0,
      right: 0,
      alignItems: 'center' as const,
      zIndex: 2,
      pointerEvents: 'none' as const,
    },
    island: {
      width: 118,
      height: 34,
      borderRadius: 999,
      backgroundColor: isDark ? '#0B0D12' : '#1C1C1E',
    },
    statusIcons: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 5,
    },
    screenHeader: {
      alignItems: 'center' as const,
      gap: 2,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    screenEyebrow: {
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: colors.secondary,
    },
    screenTitle: {
      fontSize: 17,
      fontFamily: fontSemibold,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      justifyContent: 'center' as const,
      position: 'relative' as const,
      minHeight: 0,
    },
    layer: {
      width: '100%' as const,
    },
    layerAbsolute: {
      position: 'absolute' as const,
      left: spacing.lg,
      right: spacing.lg,
      top: 0,
      bottom: spacing.lg,
      justifyContent: 'center' as const,
      backgroundColor: colors.backgroundGrouped,
    },
    caption: {
      fontSize: isHero ? 14 : 12,
      lineHeight: isHero ? 20 : 16,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
      maxWidth: frameWidth,
    },
    dots: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.separator,
    },
    dotActive: {
      width: 18,
      backgroundColor: colors.secondary,
      ...webOnlyStyle({
        transition: `width 320ms ${webMotion.easingOut}, background-color 320ms ${webMotion.easingOut}`,
      } as object),
    },
  }));

  return (
    <View style={styles.stage} accessibilityLabel={BEAT_LABEL[phase]}>
      <View style={styles.glow} />
      <View style={styles.frame}>
        <View style={styles.clip}>
          <View
            style={[
              styles.scaled,
              {
                transform: [
                  { translateX: -((PHONE_WIDTH - frameWidth) / 2) },
                  { translateY: -((PHONE_HEIGHT - frameHeight) / 2) },
                  { scale },
                ],
              },
            ]}
          >
            <View style={styles.device}>
              <View style={styles.screen}>
                <View style={styles.islandWrap}>
                  <View style={styles.island} />
                </View>
                <View style={styles.statusBar}>
                  <Text style={styles.statusTime}>9:41</Text>
                  <View style={styles.statusIcons}>
                    <Ionicons name="cellular" size={14} color={colors.labelPrimary} />
                    <Ionicons name="wifi" size={14} color={colors.labelPrimary} />
                    <Ionicons name="battery-full" size={16} color={colors.labelPrimary} />
                  </View>
                </View>

                <View style={styles.screenHeader}>
                  <Text style={styles.screenEyebrow}>Same-day cover</Text>
                  <Text style={styles.screenTitle}>
                    {phase === 'post'
                      ? 'Post fill-in'
                      : phase === 'sms'
                        ? 'Text offer'
                        : 'Confirmed'}
                  </Text>
                </View>

                <View style={styles.body}>
                  <View
                    style={[
                      styles.layerAbsolute,
                      phaseStyle(phase === 'post'),
                    ]}
                  >
                    <PostScreen />
                  </View>
                  <View
                    style={[
                      styles.layerAbsolute,
                      phaseStyle(phase === 'sms'),
                    ]}
                  >
                    <SmsScreen />
                  </View>
                  <View
                    style={[
                      styles.layerAbsolute,
                      phaseStyle(phase === 'covered'),
                    ]}
                  >
                    <CoveredScreen />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.dots}>
        {PHASES.map((id, index) => (
          <View
            key={id}
            style={[styles.dot, index === beatIndex ? styles.dotActive : null]}
          />
        ))}
      </View>
      <Text style={styles.caption}>{BEAT_LABEL[phase]}</Text>
    </View>
  );
}
