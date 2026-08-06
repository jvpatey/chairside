import { useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PublicPageCardHeader } from '@/components/legal/PublicPageCardHeader';
import { SupportContactForm } from '@/components/support/SupportContactForm';
import { SupportHelpTopics } from '@/components/support/SupportHelpTopics';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { WebMarketingFooter } from '@/components/web/marketing/WebMarketingFooter.web';
import { WebMarketingNav } from '@/components/web/marketing/WebMarketingNav.web';
import { WebPublicHeroAtmosphere } from '@/components/web/marketing/WebPublicHeroAtmosphere.web';
import { SUPPORT_PAGE_CONTENT } from '@/content/legal/support';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { radii } from '@/theme/tokens';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webTypography } from '@/theme/web';

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
    heroInner: {
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      gap: spacing.md,
    },
    title: {
      ...(isWide ? webTypography.displaySm : webTypography.headline),
      color: colors.labelPrimary,
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
          <WebPublicHeroAtmosphere />
          <WebPageEnter style={styles.heroInner}>
            <Text style={styles.title}>{SUPPORT_PAGE_CONTENT.title}</Text>
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
