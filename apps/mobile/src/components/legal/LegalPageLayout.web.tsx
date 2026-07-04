import { router } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Animated, ScrollView, Text, View, type View as ViewType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LegalTableOfContents } from '@/components/legal/LegalTableOfContents';
import { legalSectionAnchor } from '@/components/legal/legalSectionAnchor';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { WebMarketingFooter } from '@/components/web/marketing/WebMarketingFooter.web';
import { WebMarketingNav } from '@/components/web/marketing/WebMarketingNav.web';
import type { LegalPageContent } from '@/content/legal/types';
import { LEGAL_LAST_UPDATED, PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { radii } from '@/theme/tokens';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webSectionEyebrowStyle, webTypography } from '@/theme/web';

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
  const { isDark } = useTheme();
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
    hero: {
      position: 'relative' as const,
      overflow: 'hidden' as const,
      paddingTop: insets.top + 96,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    atmosphere: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      // @ts-expect-error web gradient
      backgroundImage: isDark
        ? 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(74, 154, 255, 0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(152, 150, 255, 0.12) 0%, transparent 50%)'
        : 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(26, 111, 212, 0.14) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(88, 86, 214, 0.08) 0%, transparent 50%)',
    },
    heroInner: {
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      gap: spacing.md,
    },
    eyebrow: webSectionEyebrowStyle(colors),
    title: {
      ...(isWide ? webTypography.displaySm : webTypography.headline),
      color: colors.labelPrimary,
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
      ...webTypography.bodyLg,
      color: colors.labelSecondary,
      maxWidth: 640,
    },
    layout: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
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
    sectionsStack: {
      gap: spacing.md,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xxl,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
      boxShadow: getWebShadow(isDark, 'raised'),
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
        <View style={styles.hero}>
          <View style={styles.atmosphere} />
          <WebPageEnter style={styles.heroInner}>
            <Text style={styles.eyebrow}>Legal</Text>
            <Text style={styles.title}>{content.title}</Text>
            <View style={styles.updatedPill}>
              <Text style={styles.updatedText}>Last updated: {LEGAL_LAST_UPDATED}</Text>
            </View>
            {content.intro ? <Text style={styles.intro}>{content.intro}</Text> : null}
          </WebPageEnter>
        </View>

        <View style={styles.layout}>
          {isWide && content.sections.length >= 4 ? (
            <View style={styles.tocColumn}>
              <LegalTableOfContents
                sections={content.sections}
                onSelectSection={scrollToSection}
                variant="web"
              />
            </View>
          ) : null}

          <WebPageEnter delayMs={90} style={styles.article}>
            <View ref={contentRef}>
              {!isWide && content.sections.length >= 4 ? (
                <LegalTableOfContents
                  sections={content.sections}
                  onSelectSection={scrollToSection}
                  variant="web"
                />
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
          </WebPageEnter>
        </View>

        <WebMarketingFooter />
      </Animated.ScrollView>
    </View>
  );
}
