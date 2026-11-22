import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { WebMarketingSection } from '@/components/web/marketing/WebMarketingSection.web';
import {
  WebMarketingCard,
  WebMarketingCardTitle,
  WebMarketingSectionHeader,
  WebMarketingSnapshotShell,
} from '@/components/web/marketing/WebMarketingSnapshotShell.web';
import { WelcomeSmsPreview } from '@/components/web/marketing/WelcomeSmsPreview.web';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const BEATS = [
  {
    id: 'post',
    step: '01',
    title: 'Post a fill-in',
    highlight: 'fill-in',
    accent: 'secondary' as const,
  },
  {
    id: 'text',
    step: '02',
    title: 'Pros get a text',
    highlight: 'text',
    accent: 'secondary' as const,
  },
  {
    id: 'confirm',
    step: '03',
    title: 'Confirm cover',
    highlight: 'cover',
    accent: 'tertiary' as const,
  },
] as const;

const SNAPSHOT_MIN_HEIGHT = 180;

function PostBeat() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
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
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    valueAccent: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.secondary,
    },
    posted: {
      marginTop: spacing.xs,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      alignSelf: 'flex-start' as const,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.secondarySubtle,
    },
    postedText: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.secondary,
    },
  }));

  return (
    <WebMarketingSnapshotShell style={{ flex: 1, minHeight: SNAPSHOT_MIN_HEIGHT }}>
      <View style={styles.card}>
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
    </WebMarketingSnapshotShell>
  );
}

function TextBeat() {
  const styles = useThemedStyles(() => ({
    shell: {
      flex: 1,
      minHeight: SNAPSHOT_MIN_HEIGHT,
      justifyContent: 'center' as const,
    },
  }));

  return (
    <WebMarketingSnapshotShell style={styles.shell}>
      <WelcomeSmsPreview />
    </WebMarketingSnapshotShell>
  );
}

function ConfirmBeat() {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.tertiary,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: {
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
      backgroundColor: colors.tertiary,
    },
    body: { flex: 1, minWidth: 0, gap: 2 },
    title: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.tertiary,
    },
    detail: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebMarketingSnapshotShell style={{ flex: 1, minHeight: SNAPSHOT_MIN_HEIGHT }}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>Cover confirmed</Text>
            <Text style={styles.detail} numberOfLines={2}>
              They replied YES — you picked the right match.
            </Text>
          </View>
        </View>
      </View>
    </WebMarketingSnapshotShell>
  );
}

function BeatVisual({ id }: { id: (typeof BEATS)[number]['id'] }) {
  if (id === 'post') return <PostBeat />;
  if (id === 'text') return <TextBeat />;
  return <ConfirmBeat />;
}

function StoryBeat({
  beat,
  index,
}: {
  beat: (typeof BEATS)[number];
  index: number;
}) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    stepChip: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor:
        beat.accent === 'tertiary' ? colors.tertiarySubtle : colors.secondarySubtle,
    },
    stepText: {
      fontSize: 12,
      fontWeight: '700' as const,
      letterSpacing: 0.4,
      color: beat.accent === 'tertiary' ? colors.tertiary : colors.secondary,
    },
    title: {
      flex: 1,
      minWidth: 0,
    },
  }));

  return (
    <WebPageEnter
      delayMs={120 + index * 160}
      style={{ flex: 1, minWidth: 0 }}
      trigger="visible"
    >
      <WebMarketingCard>
        <View style={styles.titleRow}>
          <View style={styles.stepChip}>
            <Text style={styles.stepText}>{beat.step}</Text>
          </View>
          <WebMarketingCardTitle
            title={beat.title}
            highlight={beat.highlight}
            accent={beat.accent}
            style={styles.title}
          />
        </View>
        <BeatVisual id={beat.id} />
      </WebMarketingCard>
    </WebPageEnter>
  );
}

export function WebLandingStory() {
  const { isWide } = useResponsiveLayout();

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
          ? 'radial-gradient(ellipse 70% 50% at 10% 20%, rgba(74, 154, 255, 0.1) 0%, transparent 58%)'
          : 'radial-gradient(ellipse 70% 50% at 10% 20%, rgba(26, 111, 212, 0.06) 0%, transparent 58%)',
      } as object),
    },
    stage: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      alignItems: 'stretch' as const,
      gap: spacing.lg,
    },
  }));

  return (
    <WebMarketingSection
      style={styles.bleed}
      sectionId="how-it-works"
      atmosphere={<View style={styles.atmosphere} />}
    >
      <WebMarketingSectionHeader
        eyebrow="How it works"
        title="Text. Reply YES. Covered."
        subtitle="Same-day fill-ins without the phone tree — clinics confirm every cover."
      />

      <View style={styles.stage}>
        {BEATS.map((beat, index) => (
          <StoryBeat key={beat.id} beat={beat} index={index} />
        ))}
      </View>
    </WebMarketingSection>
  );
}
