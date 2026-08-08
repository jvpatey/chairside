import { useEffect, useRef, useState } from 'react';
import { Text, View, type TextStyle } from 'react-native';

import { dashboardHeaderStackGap } from '@/components/dashboard/dashboardLayout';
import { getTimeOfDayGreeting } from '@/lib/greeting';
import { usePrefersReducedMotion } from '@/lib/motion';
import { IS_WEB } from '@/lib/webPressableStyles';
import { fontBold, fontRegular, fontSemibold, spacing, useThemedStyles } from '@/theme';

/** Shared vertical gap between dashboard greeting, name, and subtitle. */
export const DASHBOARD_HERO_TEXT_GAP = dashboardHeaderStackGap(spacing);

export function DashboardHeroGreeting() {
  const styles = useThemedStyles(({ colors }) => ({
    greeting: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
  }));

  return <Text style={styles.greeting}>{getTimeOfDayGreeting()}</Text>;
}

type DashboardHeroNameProps = {
  displayName?: string | null;
  namePlaceholder: string;
};

const SHIMMER_STEP_MS = 28;
const SHIMMER_LETTER_MS = 220;

function shimmerHoldMs(letterCount: number) {
  return Math.max(SHIMMER_LETTER_MS, Math.max(0, letterCount - 1) * SHIMMER_STEP_MS + SHIMMER_LETTER_MS);
}

export function DashboardHeroName({ displayName, namePlaceholder }: DashboardHeroNameProps) {
  const name = displayName?.trim();
  const reduceMotion = usePrefersReducedMotion();
  const [shimmering, setShimmering] = useState(false);
  const shimmerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (shimmerTimer.current) clearTimeout(shimmerTimer.current);
    },
    [],
  );

  const startShimmer = () => {
    if (shimmering || !name) return;
    const letterCount = Array.from(name.replace(/\s+/g, '')).length;
    setShimmering(true);
    shimmerTimer.current = setTimeout(() => setShimmering(false), shimmerHoldMs(letterCount));
  };

  const styles = useThemedStyles(({ colors }) => ({
    name: {
      fontSize: 34,
      // Tight to the glyph box so flex gap reads evenly vs greeting/meta.
      lineHeight: 38,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.6,
    },
    nameShimmer: {
      color: colors.tertiary,
    },
    nameHidden: {
      opacity: 0,
    },
    shimmerRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
    },
    word: {
      flexDirection: 'row' as const,
    },
  }));

  if (!IS_WEB || reduceMotion || !name) {
    return (
      <Text
        style={[styles.name, !name && styles.nameHidden]}
        numberOfLines={2}
        accessibilityElementsHidden={!name}
        importantForAccessibility={name ? 'yes' : 'no-hide-descendants'}>
        {name || namePlaceholder}
      </Text>
    );
  }

  // Web: on hover, a band of accent color sweeps once through the letters.
  // Words stay intact so wrapping matches normal text; letters ride staggered
  // CSS color transitions (no JS animation loop).
  let letterIndex = 0;
  const words = name.split(/\s+/);

  return (
    <View
      accessibilityRole="text"
      aria-label={name}
      style={styles.shimmerRow}
      onMouseEnter={startShimmer}>
      {words.map((word, wordIdx) => (
        <View key={`${word}-${wordIdx}`} style={styles.word} aria-hidden>
          {Array.from(word).map((letter, i) => {
            const delayMs = letterIndex * SHIMMER_STEP_MS;
            letterIndex += 1;
            return (
              <Text
                key={`${letter}-${i}`}
                style={[
                  styles.name,
                  shimmering && styles.nameShimmer,
                  {
                    transitionProperty: 'color',
                    transitionDuration: `${SHIMMER_LETTER_MS}ms`,
                    transitionTimingFunction: 'ease-in-out',
                    transitionDelay: `${delayMs}ms`,
                  } as TextStyle,
                ]}>
                {letter}
              </Text>
            );
          })}
          {wordIdx < words.length - 1 ? (
            <Text style={styles.name}>{'\u00A0'}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

type DashboardHeroSubtitleProps = {
  subtitle: string;
  /** Same-line secondary segment (e.g. "Name · Owner") — lighter than the group name. */
  detail?: string | null;
  /** Appended after subtitle with a middle dot (e.g. today's date). */
  trailing?: string;
};

export function DashboardHeroSubtitle({
  subtitle,
  detail,
  trailing,
}: DashboardHeroSubtitleProps) {
  const trimmedDetail = detail?.trim() || null;

  const styles = useThemedStyles(({ colors, typography }) => ({
    metaLine: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 20,
    },
    subtitle: {
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    subtitlePlain: {
      color: colors.labelSecondary,
    },
    detail: {
      fontFamily: fontRegular,
      fontWeight: '400',
      color: colors.labelSecondary,
    },
    metaSeparator: {
      color: colors.labelTertiary,
    },
    trailing: {
      color: colors.labelTertiary,
    },
  }));

  if (!trimmedDetail && !trailing) {
    return (
      <Text style={[styles.metaLine, styles.subtitlePlain]} numberOfLines={2}>
        {subtitle}
      </Text>
    );
  }

  return (
    <Text style={styles.metaLine} numberOfLines={2} accessibilityRole="text">
      <Text style={trimmedDetail ? styles.subtitle : styles.subtitlePlain}>{subtitle}</Text>
      {trimmedDetail ? (
        <>
          <Text style={styles.metaSeparator}> · </Text>
          <Text style={styles.detail}>{trimmedDetail}</Text>
        </>
      ) : null}
      {trailing ? (
        <>
          <Text style={styles.metaSeparator}> · </Text>
          <Text style={styles.trailing}>{trailing}</Text>
        </>
      ) : null}
    </Text>
  );
}

type DashboardHeroIdentityProps = {
  displayName?: string | null;
  namePlaceholder: string;
  subtitle: string;
};

export function DashboardHeroIdentity({
  displayName,
  namePlaceholder,
  subtitle,
}: DashboardHeroIdentityProps) {
  return (
    <>
      <DashboardHeroName displayName={displayName} namePlaceholder={namePlaceholder} />
      <DashboardHeroSubtitle subtitle={subtitle} />
    </>
  );
}
