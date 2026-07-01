import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import type { LegalSection } from '@/content/legal/types';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TOPIC_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Account and sign-in': 'key-outline',
  'Delete your account': 'trash-outline',
  Notifications: 'notifications-outline',
  'Uploads and files': 'cloud-upload-outline',
  'Clinics and workers': 'people-outline',
  Legal: 'document-text-outline',
};

type SupportHelpTopicsProps = {
  sections: LegalSection[];
};

function toggleLayoutAnimation() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function HelpTopicBody({ section }: { section: LegalSection }) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    body: {
      gap: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      paddingLeft: 44 + spacing.md,
    },
    paragraph: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 24,
      color: colors.labelSecondary,
    },
    link: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    bulletRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      paddingRight: spacing.sm,
    },
    bullet: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 24,
      color: colors.primary,
      width: 16,
      fontWeight: '700' as const,
    },
    bulletText: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 24,
      color: colors.labelSecondary,
      flex: 1,
    },
  }));

  if (section.title === 'Legal') {
    return (
      <View style={styles.body}>
        <Text style={styles.paragraph}>
          See our{' '}
          <Text
            style={styles.link}
            accessibilityRole="link"
            onPress={() => router.push(PUBLIC_LEGAL_PATHS.privacy)}>
            Privacy Policy
          </Text>{' '}
          and{' '}
          <Text
            style={styles.link}
            accessibilityRole="link"
            onPress={() => router.push(PUBLIC_LEGAL_PATHS.terms)}>
            Terms of Service
          </Text>{' '}
          for how we handle data and platform use.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.body}>
      {section.paragraphs?.map((paragraph) => (
        <Text key={paragraph} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
      {section.bullets?.map((bullet) => (
        <View key={bullet} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  );
}

function HelpTopicRow({
  section,
  expanded,
  onToggle,
  showDivider,
}: {
  section: LegalSection;
  expanded: boolean;
  onToggle: () => void;
  showDivider: boolean;
}) {
  const { colors } = useTheme();
  const iconName = TOPIC_ICONS[section.title] ?? 'help-circle-outline';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      overflow: 'hidden' as const,
    },
    headerPressable: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      ...webPointer(),
    },
    headerHovered: webListRowHoverStyles(colors),
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
    },
    title: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.separator,
      marginLeft: spacing.lg + 44 + spacing.md,
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
        ]}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={22} color={colors.primary} />
        </View>
        <Text style={styles.title}>{section.title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.labelTertiary}
        />
      </Pressable>
      {expanded ? <HelpTopicBody section={section} /> : null}
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

export function SupportHelpTopics({ sections }: SupportHelpTopicsProps) {
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(() => new Set());

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
    },
    heading: {
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.body,
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
    },
  }));

  const toggleSection = (title: string) => {
    toggleLayoutAnimation();
    setExpandedTitles((current) => {
      const next = new Set(current);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <Text style={styles.title}>Help topics</Text>
        <Text style={styles.subtitle}>Tap a topic to expand answers and troubleshooting tips.</Text>
      </View>

      <View style={styles.card}>
        {sections.map((section, index) => (
          <HelpTopicRow
            key={section.title}
            section={section}
            expanded={expandedTitles.has(section.title)}
            onToggle={() => toggleSection(section.title)}
            showDivider={index < sections.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
