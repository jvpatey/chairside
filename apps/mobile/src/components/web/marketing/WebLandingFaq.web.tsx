import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { WebMarketingSection } from '@/components/web/marketing/WebMarketingSection.web';
import { WebMarketingSectionHeader } from '@/components/web/marketing/WebMarketingSnapshotShell.web';
import { webHover, webListRowHoverStyles, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_ITEMS = [
  {
    id: 'free-tier',
    question: 'Is there really a free tier?',
    answer:
      'Yes. Clinics can keep one live role and one live fill-in at no cost. Dental professionals — hygienists, assistants, receptionists, and others — always join and apply for free.',
  },
  {
    id: 'who-can-join',
    question: 'Who can join Chairside?',
    answer:
      'Canadian dental clinics hiring staff, and dental professionals looking for permanent roles or fill-in shifts. Create a clinic profile to post openings, or a professional profile to browse and apply.',
  },
  {
    id: 'provinces',
    question: 'Which provinces do you cover?',
    answer:
      'Chairside is built for Canadian dental practices, with strong coverage across Atlantic Canada — Nova Scotia, New Brunswick, Prince Edward Island, and Newfoundland and Labrador. We are expanding to more provinces over time.',
  },
  {
    id: 'fill-ins',
    question: 'How do fill-in shifts work?',
    answer:
      'Clinics post a same-day or short-notice fill-in. Available professionals nearby get a push and SMS, then request to cover in-app. You accept the right person and message them in Chairside — no phone tree.',
  },
  {
    id: 'matching',
    question: 'How does matching and screening work?',
    answer:
      'Professionals see match scores on roles so they can tell fit at a glance. Clinics can add screening questions on paid plans, then compare applicants before opening a message.',
  },
  {
    id: 'groups',
    question: 'Can multi-location groups use Chairside?',
    answer:
      'Yes. Group plans let you manage multiple locations, invite managers, and keep hiring centralized. Start free with up to two locations and one manager per location, plus one live role and one live fill-in across the group.',
  },
] as const;

function toggleLayoutAnimation() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function FaqItem({
  item,
  expanded,
  onToggle,
  showDivider,
}: {
  item: (typeof FAQ_ITEMS)[number];
  expanded: boolean;
  onToggle: () => void;
  showDivider: boolean;
}) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      overflow: 'hidden' as const,
    },
    headerPressable: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      ...webPointer(),
    },
    headerHovered: webListRowHoverStyles(colors),
    question: {
      flex: 1,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    answerWrap: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md + 2,
      paddingTop: spacing.xs,
    },
    answer: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.labelSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.separator,
      marginHorizontal: spacing.lg,
    },
  }));

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed, hovered }) => [
          styles.headerPressable,
          webHover(hovered, pressed, styles.headerHovered),
          pressed && { opacity: 0.88 },
        ]}
      >
        <Text style={styles.question}>{item.question}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.labelTertiary}
        />
      </Pressable>
      {expanded ? (
        <View style={styles.answerWrap}>
          <Text style={styles.answer}>{item.answer}</Text>
        </View>
      ) : null}
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

export function WebLandingFaq() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const { isDark } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    bleed: {
      paddingVertical: spacing.xl * 2.5,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
  }));

  const toggleItem = (id: string) => {
    toggleLayoutAnimation();
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <WebMarketingSection style={styles.bleed} sectionId="faq">
      <WebPageEnter trigger="visible">
        <WebMarketingSectionHeader
          eyebrow="FAQ"
          title="Common questions"
          subtitle="Straight answers about pricing, coverage, and how Chairside works."
        />

        <View style={styles.card}>
          {FAQ_ITEMS.map((item, index) => (
            <FaqItem
              key={item.id}
              item={item}
              expanded={expandedIds.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              showDivider={index < FAQ_ITEMS.length - 1}
            />
          ))}
        </View>
      </WebPageEnter>
    </WebMarketingSection>
  );
}
