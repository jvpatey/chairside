import { router } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ScrollView, Text, View, type View as ViewType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LegalTableOfContents } from '@/components/legal/LegalTableOfContents';
import { legalSectionAnchor } from '@/components/legal/legalSectionAnchor';
import { PublicLegalPageHeader } from '@/components/legal/PublicLegalPageHeader';
import type { LegalPageContent } from '@/content/legal/types';
import { LEGAL_LAST_UPDATED, PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import { WebMarketingFooter } from '@/components/web/marketing/WebMarketingFooter.web';
import { WebMarketingNav } from '@/components/web/marketing/WebMarketingNav.web';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webTypography } from '@/theme/web';
import { Animated } from 'react-native';

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
  const styles = useThemedStyles(({ colors, typography, spacing }) => ({
    text: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 24,
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
            accessibilityRole="link"
          >
            {part.value}
          </Text>
        ) : (
          <Text key={`text-${index}`}>{part.value}</Text>
        ),
      )}
    </Text>
  );
}

export function LegalPageLayout({
  content,
  currentPath: _currentPath,
}: LegalPageLayoutProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isWide } = useResponsiveLayout();
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<ViewType>(null);
  const sectionRefs = useRef<Record<string, ViewType | null>>({});
  const scrollY = useRef(new Animated.Value(0)).current;

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

  const styles = useThemedStyles(({ colors, spacing }) => ({
    page: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    layout: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + 96,
      gap: spacing.xl,
    },
    tocColumn: {
      width: isWide ? 240 : undefined,
      flexShrink: 0,
      ...(isWide
        ? ({
            position: 'sticky' as const,
            top: 96,
            alignSelf: 'flex-start' as const,
          } as object)
        : {}),
    },
    article: {
      flex: 1,
      minWidth: 0,
      maxWidth: isWide ? 720 : undefined,
    },
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
      marginBottom: spacing.xs,
    },
    updated: {
      fontSize: 13,
      color: colors.labelTertiary,
      marginBottom: spacing.lg,
    },
    intro: {
      ...webTypography.bodyLg,
      color: colors.labelSecondary,
      marginBottom: spacing.xl,
    },
    sectionsStack: {
      gap: spacing.md,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
      boxShadow: getWebShadow(isDark, 'subtle'),
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
      marginBottom: spacing.xs,
    },
    bulletRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      paddingRight: spacing.sm,
    },
    bullet: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.primary,
      width: 16,
      fontWeight: '700' as const,
    },
    bulletText: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.labelSecondary,
      flex: 1,
    },
  }));

  return (
    <View style={styles.page}>
      <WebMarketingNav scrollY={scrollY} />
      <Animated.ScrollView
        ref={scrollRef}
        style={[styles.page, webScrollbarStyles()]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      >
        <View style={styles.layout}>
          {content.sections.length >= 4 ? (
            <View style={styles.tocColumn}>
              <LegalTableOfContents sections={content.sections} onSelectSection={scrollToSection} />
            </View>
          ) : null}

          <View style={styles.article} ref={contentRef}>
            <PublicLegalPageHeader />
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</Text>
            {content.intro ? <Text style={styles.intro}>{content.intro}</Text> : null}

            {!isWide && content.sections.length >= 4 ? (
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
                  style={styles.sectionCard}
                >
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
          </View>
        </View>
        <WebMarketingFooter />
      </Animated.ScrollView>
    </View>
  );
}
