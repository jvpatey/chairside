import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { ThemeColors } from '@/theme/colors';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webCardLiftBase, webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webSectionEyebrowStyle, webTypography } from '@/theme/web';

const HERO_FEATURE = {
  icon: 'calendar-outline' as const,
  title: 'Fill chairs, same day',
  highlight: 'same day',
  subtitle: 'Built for same-day coverage',
  body: 'Post a fill-in shift and get qualified applicants fast. Screening filters candidates before you open a message.',
};

const SATELLITE_FEATURES = [
  {
    id: 'availability',
    icon: 'flash-outline' as const,
    title: "Let clinics know you're free",
    highlight: "you're free",
    body: 'Turn on fill-in mode and get discovered by nearby clinics instantly.',
  },
  {
    id: 'matches',
    icon: 'sparkles-outline' as const,
    title: 'Better matches from the start',
    highlight: 'matches',
    body: 'Application kits and match scores help clinics compare fit in seconds.',
  },
  {
    id: 'hiring',
    icon: 'chatbubbles-outline' as const,
    title: 'The hiring process — streamlined',
    highlight: 'streamlined',
    body: 'Messages, interviews, and offers — without the email thread spiral.',
  },
] as const;

const CALENDAR_DAYS = [
  { label: 'Mon', day: '30', status: 'empty' as const },
  { label: 'Tue', day: '1', status: 'open' as const, shift: 'Hygienist' },
  { label: 'Wed', day: '2', status: 'filled' as const, shift: 'Assistant' },
  { label: 'Thu', day: '3', status: 'open' as const, shift: 'Receptionist' },
  { label: 'Fri', day: '4', status: 'empty' as const },
] as const;

function dayAccent(status: (typeof CALENDAR_DAYS)[number]['status'], colors: ThemeColors) {
  if (status === 'open') return colors.primary;
  if (status === 'filled') return colors.success;
  return colors.labelTertiary;
}

function HighlightTitle({
  title,
  highlight,
  variant = 'satellite',
}: {
  title: string;
  highlight?: string;
  variant?: 'hero' | 'satellite';
}) {
  const { colors } = useTheme();
  const fontSize = variant === 'hero' ? 28 : 18;
  const lineHeight = variant === 'hero' ? 34 : 24;

  if (!highlight || !title.includes(highlight)) {
    return (
      <Text
        style={{
          fontSize,
          lineHeight,
          fontWeight: '700',
          color: colors.labelPrimary,
        }}
      >
        {title}
      </Text>
    );
  }

  const [before, after] = title.split(highlight);
  return (
    <Text
      style={{
        fontSize,
        lineHeight,
        fontWeight: '700',
        color: colors.labelPrimary,
      }}
    >
      {before}
      <Text style={{ color: colors.primary }}>{highlight}</Text>
      {after}
    </Text>
  );
}

function FeatureCardHeader({
  icon,
  title,
  highlight,
  subtitle,
  variant = 'satellite',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  highlight?: string;
  subtitle?: string;
  variant?: 'hero' | 'satellite';
}) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    header: {
      gap: variant === 'hero' ? spacing.xs : 2,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    titleWrap: {
      flex: 1,
      minWidth: 0,
    },
    subtitle: {
      fontSize: variant === 'hero' ? 13 : 15,
      lineHeight: variant === 'hero' ? 18 : 22,
      fontWeight: variant === 'hero' ? ('600' as const) : ('400' as const),
      letterSpacing: variant === 'hero' ? 0.3 : 0,
      textTransform: variant === 'hero' ? ('uppercase' as const) : undefined,
      color: variant === 'hero' ? colors.primary : colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Ionicons name={icon} size={22} color={colors.primary} />
        <View style={styles.titleWrap}>
          <HighlightTitle title={title} highlight={highlight} variant={variant} />
        </View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function FeatureAvailabilityPreview() {
  const { colors } = useTheme();
  const openCount = CALENDAR_DAYS.filter((day) => day.status === 'open').length;

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    shell: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
      overflow: 'hidden' as const,
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      backgroundColor: colors.surface,
    },
    headerLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      color: colors.labelSecondary,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: `${colors.primary}20`,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    body: {
      padding: spacing.md,
      gap: spacing.md,
    },
    weekRow: {
      flexDirection: 'row' as const,
      gap: spacing.xs,
    },
    dayCell: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center' as const,
      gap: 4,
      paddingVertical: spacing.sm,
      paddingHorizontal: 2,
      borderRadius: 10,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    dayCellEmpty: {
      borderColor: colors.separator,
    },
    dayCellOpen: {
      borderColor: `${colors.primary}55`,
      ...webOnlyStyle({
        backgroundImage: `linear-gradient(180deg, ${colors.primary}18 0%, ${colors.surface} 100%)`,
      } as object),
    },
    dayCellFilled: {
      borderColor: `${colors.success}44`,
    },
    dayLabel: {
      fontSize: 10,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    dayNumber: {
      fontSize: 15,
      lineHeight: 18,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    shiftDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legend: {
      gap: spacing.xs,
    },
    legendRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    legendRole: {
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
  }));

  const openDays = CALENDAR_DAYS.filter((day) => day.status === 'open' && 'shift' in day);
  const filledDays = CALENDAR_DAYS.filter((day) => day.status === 'filled' && 'shift' in day);

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>This week</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {openCount} open shift{openCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.weekRow}>
          {CALENDAR_DAYS.map((day) => {
            const accent = dayAccent(day.status, colors);
            const cellStyle =
              day.status === 'open'
                ? styles.dayCellOpen
                : day.status === 'filled'
                  ? styles.dayCellFilled
                  : styles.dayCellEmpty;

            return (
              <View key={day.label} style={[styles.dayCell, cellStyle]}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <Text style={styles.dayNumber}>{day.day}</Text>
                {day.status !== 'empty' ? (
                  <View style={[styles.shiftDot, { backgroundColor: accent }]} />
                ) : (
                  <View style={{ height: 6 }} />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          {openDays.map((day) => (
            <View key={`open-${day.label}`} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>
                <Text style={styles.legendRole}>{day.shift}</Text> needed · {day.label}
              </Text>
            </View>
          ))}
          {filledDays.map((day) => (
            <View key={`filled-${day.label}`} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>
                <Text style={styles.legendRole}>{day.shift}</Text> filled · {day.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function FeatureHeroCard() {
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      borderRadius: 24,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.lg,
      ...webCardLiftBase(),
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'raised') } as object),
    },
    layout: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.xl,
      alignItems: isWide ? ('center' as const) : ('stretch' as const),
    },
    copy: {
      flex: isWide ? 1 : undefined,
      gap: spacing.lg,
      minWidth: 0,
    },
    preview: {
      flex: isWide ? 1 : undefined,
      width: '100%' as const,
      maxWidth: isWide ? 380 : undefined,
      alignSelf: isWide ? ('stretch' as const) : ('stretch' as const),
    },
    body: {
      fontSize: 17,
      lineHeight: 26,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebPageEnter>
      <View style={styles.card}>
        <View style={styles.layout}>
          <View style={styles.copy}>
            <FeatureCardHeader
              icon={HERO_FEATURE.icon}
              title={HERO_FEATURE.title}
              highlight={HERO_FEATURE.highlight}
              subtitle={HERO_FEATURE.subtitle}
              variant="hero"
            />
            <Text style={styles.body}>{HERO_FEATURE.body}</Text>
          </View>
          <View style={styles.preview}>
            <FeatureAvailabilityPreview />
          </View>
        </View>
      </View>
    </WebPageEnter>
  );
}

function FeatureSatelliteCard({
  feature,
  enterDelayMs,
}: {
  feature: (typeof SATELLITE_FEATURES)[number];
  enterDelayMs?: number;
}) {
  const { isDark } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      flex: 1,
      borderRadius: 20,
      padding: spacing.lg + 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.md,
      minHeight: 200,
      ...webCardLiftBase(),
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebPageEnter delayMs={enterDelayMs} style={{ flex: 1 }}>
      <View style={styles.card}>
        <FeatureCardHeader
          icon={feature.icon}
          title={feature.title}
          highlight={feature.highlight}
        />
        <Text style={styles.body}>{feature.body}</Text>
      </View>
    </WebPageEnter>
  );
}

export function WebLandingFeatures() {
  const { colors } = useTheme();
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl * 2.5,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      ...webOnlyStyle({
        backgroundImage: `linear-gradient(180deg, ${colors.fillSubtle} 0%, transparent 120px)`,
      } as object),
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xl + spacing.sm,
      maxWidth: 520,
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
    satellites: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.md,
      marginTop: spacing.lg,
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Features</Text>
        <Text style={styles.title}>Built for how dental teams actually work</Text>
        <Text style={styles.subtitle}>
          One platform for clinics hiring and professionals finding work — starting with same-day
          fill-ins.
        </Text>
      </View>

      <FeatureHeroCard />

      <View style={styles.satellites}>
        {SATELLITE_FEATURES.map((feature, index) => (
          <FeatureSatelliteCard key={feature.id} feature={feature} enterDelayMs={120 + index * 80} />
        ))}
      </View>
    </View>
  );
}
