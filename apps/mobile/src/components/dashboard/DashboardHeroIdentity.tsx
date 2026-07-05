import { Text } from 'react-native';

import { dashboardHeaderStackGap } from '@/components/dashboard/dashboardLayout';
import { getTimeOfDayGreeting } from '@/lib/greeting';
import { fontBold, fontRegular, spacing, useThemedStyles } from '@/theme';

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
      lineHeight: 40,
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
  /** Appended after subtitle with a middle dot (e.g. today's date). */
  trailing?: string;
};

export function DashboardHeroSubtitle({ subtitle, trailing }: DashboardHeroSubtitleProps) {
  const styles = useThemedStyles(({ colors, typography }) => ({
    metaLine: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 20,
    },
    subtitle: {
      color: colors.labelSecondary,
    },
    metaSeparator: {
      color: colors.labelTertiary,
    },
    trailing: {
      color: colors.labelTertiary,
    },
  }));

  if (!trailing) {
    return (
      <Text style={[styles.metaLine, styles.subtitle]} numberOfLines={2}>
        {subtitle}
      </Text>
    );
  }

  return (
    <Text style={styles.metaLine} numberOfLines={1} accessibilityRole="text">
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.metaSeparator}> · </Text>
      <Text style={styles.trailing}>{trailing}</Text>
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
