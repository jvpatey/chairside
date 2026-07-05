import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { PUBLIC_LEGAL_PATHS, LEGAL_LAST_UPDATED } from '@/constants/legal';
import type { LegalSection } from '@/content/legal/types';
import { PublicPageCardHeader } from '@/components/legal/PublicPageCardHeader';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getElevationStyle, radii } from '@/theme/tokens';
import { getWebShadow } from '@/theme/web';

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
  lastUpdated?: string;
};

function toggleLayoutAnimation() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function HelpTopicBody({ section }: { section: LegalSection }) {
  const { isCompact } = useResponsiveLayout();
  const iconInset = isCompact ? 36 : 44;
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    body: {
      gap: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      paddingLeft: iconInset + spacing.md,
      paddingRight: isCompact ? spacing.sm : 0,
    },
    paragraph: {
      ...typography.body,
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 22 : 24,
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
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 22 : 24,
      color: colors.primary,
      width: 16,
      fontWeight: '700' as const,
    },
    bulletText: {
      ...typography.body,
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 22 : 24,
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
  const { isCompact } = useResponsiveLayout();
  const iconName = TOPIC_ICONS[section.title] ?? 'help-circle-outline';
  const iconSize = isCompact ? 36 : 44;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      overflow: 'hidden' as const,
    },
    headerPressable: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: isCompact ? spacing.sm : spacing.md,
      paddingVertical: isCompact ? spacing.sm : spacing.md,
      paddingHorizontal: isCompact ? spacing.md : spacing.lg,
      borderRadius: 12,
      minHeight: isCompact ? 52 : undefined,
      ...webPointer(),
    },
    headerHovered: webListRowHoverStyles(colors),
    iconWrap: {
      width: iconSize,
      height: iconSize,
      borderRadius: isCompact ? 10 : 12,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
    },
    title: {
      ...typography.body,
      fontSize: isCompact ? 15 : 16,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.separator,
      marginLeft: (isCompact ? spacing.md : spacing.lg) + iconSize + (isCompact ? spacing.sm : spacing.md),
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
          <Ionicons name={iconName} size={isCompact ? 20 : 22} color={colors.primary} />
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

export function SupportHelpTopics({
  sections,
  lastUpdated = LEGAL_LAST_UPDATED,
}: SupportHelpTopicsProps) {
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(() => new Set());
  const { isCompact } = useResponsiveLayout();
  const { isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: isWeb ? radii.xxl : isCompact ? radii.lg : radii.xl,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
      ...(isWeb
        ? { boxShadow: getWebShadow(isDark, 'raised') }
        : getElevationStyle({ isDark, level: 'subtle' })),
    },
    cardHeader: {
      padding: isCompact ? spacing.md : spacing.lg,
      gap: spacing.sm,
    },
    headerTextInset: {
      marginLeft: (isCompact ? 40 : 44) + (isCompact ? spacing.sm : spacing.md),
    },
    updatedPill: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.pill,
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    updatedText: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      color: colors.labelTertiary,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.separator,
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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <PublicPageCardHeader
          icon="help-circle-outline"
          title="Help topics"
          subtitle="Tap a topic to expand answers and troubleshooting tips."
        />
        <View style={[styles.updatedPill, styles.headerTextInset]}>
          <Text style={styles.updatedText}>Last updated: {lastUpdated}</Text>
        </View>
      </View>

      <View style={styles.sectionDivider} />

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
  );
}
