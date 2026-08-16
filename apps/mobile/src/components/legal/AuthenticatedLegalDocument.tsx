import { router, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Text, View, type View as ViewType } from 'react-native';

import { LegalTableOfContents } from '@/components/legal/LegalTableOfContents';
import { legalSectionAnchor } from '@/components/legal/legalSectionAnchor';
import { useDetailScroll } from '@/components/ui/DetailScreen';
import type { LegalPathKey } from '@/constants/legal';
import { LEGAL_LAST_UPDATED } from '@/constants/legal';
import type { LegalPageContent } from '@/content/legal/types';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';
import { getElevationStyle, radii } from '@/theme/tokens';

export type AuthenticatedLegalPaths = Record<LegalPathKey, Href>;

const INLINE_LINKS: { phrase: string; path: LegalPathKey }[] = [
  { phrase: 'Privacy Policy', path: 'privacy' },
  { phrase: 'Terms of Service', path: 'terms' },
  { phrase: 'Support page', path: 'support' },
];

type TextPart =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; path: LegalPathKey };

function parseLegalInlineText(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliestIndex = remaining.length;
    let matchedLink: (typeof INLINE_LINKS)[number] | null = null;

    for (const link of INLINE_LINKS) {
      const index = remaining.indexOf(link.phrase);
      if (index >= 0 && index < earliestIndex) {
        earliestIndex = index;
        matchedLink = link;
      }
    }

    if (!matchedLink) {
      parts.push({ type: 'text', value: remaining });
      break;
    }

    if (earliestIndex > 0) {
      parts.push({ type: 'text', value: remaining.slice(0, earliestIndex) });
    }

    parts.push({ type: 'link', value: matchedLink.phrase, path: matchedLink.path });
    remaining = remaining.slice(earliestIndex + matchedLink.phrase.length);
  }

  return parts;
}

function LegalBodyText({
  children,
  legalPaths,
}: {
  children: string;
  legalPaths: AuthenticatedLegalPaths;
}) {
  const { isCompact } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, typography, spacing }) => ({
    text: {
      ...typography.body,
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 22 : 24,
      color: colors.labelSecondary,
      marginBottom: spacing.sm,
    },
    link: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
  }));

  const parts = parseLegalInlineText(children);
  const hasLinks = parts.some((part) => part.type === 'link');

  if (!hasLinks) {
    return <Text style={styles.text}>{children}</Text>;
  }

  return (
    <Text style={styles.text}>
      {parts.map((part, index) =>
        part.type === 'link' ? (
          <Text
            key={`${part.path}-${index}`}
            style={styles.link}
            onPress={() => router.push(legalPaths[part.path])}
            accessibilityRole="link">
            {part.value}
          </Text>
        ) : (
          <Text key={`text-${index}`}>{part.value}</Text>
        ),
      )}
    </Text>
  );
}

type AuthenticatedLegalDocumentProps = {
  content: LegalPageContent;
  legalPaths: AuthenticatedLegalPaths;
};

/** Legal body for signed-in profile stacks (no public chrome / wordmark). */
export function AuthenticatedLegalDocument({
  content,
  legalPaths,
}: AuthenticatedLegalDocumentProps) {
  const { isCompact } = useResponsiveLayout();
  const detailScroll = useDetailScroll();
  const contentRef = useRef<ViewType>(null);
  const sectionRefs = useRef<Record<string, ViewType | null>>({});

  const scrollToSection = useCallback(
    (title: string) => {
      const sectionRef = sectionRefs.current[title];
      const contentView = contentRef.current;
      if (!sectionRef || !contentView) return;

      sectionRef.measureLayout(
        contentView,
        (_x, y) => {
          detailScroll?.scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
        },
        () => {},
      );
    },
    [detailScroll],
  );

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    root: {
      gap: isCompact ? spacing.md : spacing.lg,
      paddingBottom: spacing.lg,
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
    intro: {
      ...typography.body,
      fontSize: isCompact ? 15 : 16,
      lineHeight: isCompact ? 24 : 26,
      color: colors.labelSecondary,
    },
    sectionsStack: {
      gap: isCompact ? spacing.sm : spacing.md,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: isCompact ? radii.lg : radii.xl,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: isCompact ? spacing.md : spacing.lg,
      gap: isCompact ? spacing.xs : spacing.sm,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
    sectionTitle: {
      ...typography.body,
      fontSize: isCompact ? 17 : 18,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
      marginBottom: isCompact ? 0 : spacing.xs,
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

  return (
    <View ref={contentRef} style={styles.root}>
      <View style={styles.updatedPill}>
        <Text style={styles.updatedText}>Last updated: {LEGAL_LAST_UPDATED}</Text>
      </View>

      {content.intro ? <Text style={styles.intro}>{content.intro}</Text> : null}

      {content.sections.length >= 4 ? (
        <LegalTableOfContents sections={content.sections} onSelectSection={scrollToSection} />
      ) : null}

      <View style={styles.sectionsStack}>
        {content.sections.map((section) => (
          <View
            key={section.title}
            ref={(node) => {
              sectionRefs.current[section.title] = node;
            }}
            nativeID={legalSectionAnchor(section.title)}
            style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs?.map((paragraph) => (
              <LegalBodyText key={paragraph} legalPaths={legalPaths}>
                {paragraph}
              </LegalBodyText>
            ))}
            {section.bullets?.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
