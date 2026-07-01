import { router } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ScrollView, Text, View, type View as ViewType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LegalTableOfContents } from '@/components/legal/LegalTableOfContents';
import { legalSectionAnchor } from '@/components/legal/legalSectionAnchor';
import { getPublicLegalFooterLinks, PublicSiteFooter } from '@/components/legal/PublicSiteFooter';
import { PublicLegalPageHeader } from '@/components/legal/PublicLegalPageHeader';
import { PublicLegalPageShell } from '@/components/legal/PublicLegalPageShell';
import type { LegalPageContent } from '@/content/legal/types';
import { LEGAL_LAST_UPDATED, PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useThemedStyles } from '@/theme';

type LegalPageLayoutProps = {
  content: LegalPageContent;
  currentPath: keyof typeof PUBLIC_LEGAL_PATHS;
};

const INLINE_LINKS: { phrase: string; path: keyof typeof PUBLIC_LEGAL_PATHS }[] = [
  { phrase: 'Privacy Policy', path: 'privacy' },
  { phrase: 'Terms of Service', path: 'terms' },
  { phrase: 'Support page', path: 'support' },
];

type TextPart =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; path: keyof typeof PUBLIC_LEGAL_PATHS };

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

function LegalBodyText({ children }: { children: string }) {
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
            onPress={() => router.push(PUBLIC_LEGAL_PATHS[part.path])}
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

export function LegalPageLayout({ content, currentPath }: LegalPageLayoutProps) {
  const insets = useSafeAreaInsets();
  const { isCompact } = useResponsiveLayout();
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<ViewType>(null);
  const sectionRefs = useRef<Record<string, ViewType | null>>({});

  const scrollToSection = useCallback((title: string) => {
    const sectionRef = sectionRefs.current[title];
    const contentView = contentRef.current;
    if (!sectionRef || !contentView) return;

    sectionRef.measureLayout(
      contentView,
      (_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      },
      () => {},
    );
  }, []);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    page: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: isCompact ? spacing.md : spacing.lg,
      paddingTop: insets.top + (isCompact ? spacing.md : spacing.lg),
      paddingBottom: insets.bottom + (isCompact ? spacing.lg : spacing.xl),
      alignSelf: 'center' as const,
      width: '100%' as const,
      maxWidth: CONTENT_MAX_WIDTH.regular,
    },
    title: {
      ...typography.title,
      fontSize: isCompact ? 28 : 32,
      lineHeight: isCompact ? 34 : 38,
      marginBottom: spacing.xs,
      color: colors.labelPrimary,
    },
    updated: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.labelTertiary,
      marginBottom: isCompact ? spacing.md : spacing.lg,
    },
    intro: {
      ...typography.body,
      fontSize: isCompact ? 15 : 16,
      lineHeight: isCompact ? 24 : 26,
      color: colors.labelSecondary,
      marginBottom: isCompact ? spacing.lg : spacing.xl,
    },
    sectionsStack: {
      gap: isCompact ? spacing.sm : spacing.md,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: isCompact ? 12 : 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: isCompact ? spacing.md : spacing.lg,
      gap: isCompact ? spacing.xs : spacing.sm,
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
    <PublicLegalPageShell>
      <ScrollView ref={scrollRef} style={styles.page} contentContainerStyle={styles.scrollContent}>
      <View ref={contentRef}>
        <PublicLegalPageHeader />

        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</Text>
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
                <LegalBodyText key={paragraph}>{paragraph}</LegalBodyText>
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

        {!isCompact ? (
          <PublicSiteFooter links={getPublicLegalFooterLinks(currentPath)} />
        ) : null}
      </View>
      </ScrollView>
    </PublicLegalPageShell>
  );
}
