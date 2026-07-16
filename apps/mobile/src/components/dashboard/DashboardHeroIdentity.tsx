import { Text } from 'react-native';

import { dashboardHeaderStackGap } from '@/components/dashboard/dashboardLayout';
import { getTimeOfDayGreeting } from '@/lib/greeting';
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

export function DashboardHeroName({ displayName, namePlaceholder }: DashboardHeroNameProps) {
  const name = displayName?.trim();

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
    nameHidden: {
      opacity: 0,
    },
  }));

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
