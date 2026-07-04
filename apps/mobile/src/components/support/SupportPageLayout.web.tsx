import { useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PublicPageCardHeader } from '@/components/legal/PublicPageCardHeader';
import { SupportContactForm } from '@/components/support/SupportContactForm';
import { SupportHelpTopics } from '@/components/support/SupportHelpTopics';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { WebMarketingFooter } from '@/components/web/marketing/WebMarketingFooter.web';
import { WebMarketingNav } from '@/components/web/marketing/WebMarketingNav.web';
import { LEGAL_LAST_UPDATED } from '@/constants/legal';
import { SUPPORT_PAGE_CONTENT } from '@/content/legal/support';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { radii } from '@/theme/tokens';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webSectionEyebrowStyle, webTypography } from '@/theme/web';

const FAQ_SECTIONS = SUPPORT_PAGE_CONTENT.sections.filter(
  (section) => section.title !== 'Contact us' && section.title !== 'Report a problem',
);

export function SupportPageLayout() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { isWide } = useResponsiveLayout();
  const scrollY = useRef(new Animated.Value(0)).current;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    page: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    hero: {
      position: 'relative' as const,
      overflow: 'hidden' as const,
      paddingTop: insets.top + 96,
      paddingBottom: spacing.xl,
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
    metaRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      flexWrap: 'wrap' as const,
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
    content: {
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.xl,
    },
    columns: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.xl,
      alignItems: 'flex-start' as const,
    },
    formColumn: {
      flex: isWide ? 1.1 : undefined,
      minWidth: isWide ? 400 : undefined,
      width: isWide ? undefined : ('100%' as const),
    },
    topicsColumn: {
      flex: isWide ? 1 : undefined,
      minWidth: isWide ? 360 : undefined,
      width: isWide ? undefined : ('100%' as const),
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xxl,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.lg,
      boxShadow: getWebShadow(isDark, 'raised'),
    },
  }));

  return (
    <View style={styles.page}>
      <WebMarketingNav scrollY={scrollY} />
      <Animated.ScrollView
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
            <Text style={styles.eyebrow}>Support</Text>
            <Text style={styles.title}>{SUPPORT_PAGE_CONTENT.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.updatedPill}>
                <Text style={styles.updatedText}>Last updated: {LEGAL_LAST_UPDATED}</Text>
              </View>
            </View>
            <Text style={styles.intro}>{SUPPORT_PAGE_CONTENT.intro}</Text>
          </WebPageEnter>
        </View>

        <View style={styles.content}>
          <View style={styles.columns}>
            <WebPageEnter delayMs={90} style={styles.formColumn}>
              <View style={styles.formCard}>
                <PublicPageCardHeader
                  icon="mail-outline"
                  title="Contact us"
                  subtitle="Send a message for bugs, account issues, or questions. We typically respond within one to two business days."
                />
                <SupportContactForm />
              </View>
            </WebPageEnter>

            <WebPageEnter delayMs={180} style={styles.topicsColumn}>
              <SupportHelpTopics sections={FAQ_SECTIONS} />
            </WebPageEnter>
          </View>
        </View>

        <WebMarketingFooter />
      </Animated.ScrollView>
    </View>
  );
}
