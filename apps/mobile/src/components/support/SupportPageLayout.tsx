import { ScrollView, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  enterFadeUp,
  PUBLIC_PAGE_STAGGER,
} from '@/components/onboarding/onboardingAnimations';
import { getPublicLegalFooterLinks, PublicSiteFooter } from '@/components/legal/PublicSiteFooter';
import { PublicLegalPageHeader } from '@/components/legal/PublicLegalPageHeader';
import { PublicLegalPageShell } from '@/components/legal/PublicLegalPageShell';
import { SupportContactForm } from '@/components/support/SupportContactForm';
import { SupportHelpTopics } from '@/components/support/SupportHelpTopics';
import { SUPPORT_PAGE_CONTENT } from '@/content/legal/support';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useThemedStyles } from '@/theme';
import { getElevationStyle, radii } from '@/theme/tokens';

const FAQ_SECTIONS = SUPPORT_PAGE_CONTENT.sections.filter(
  (section) => section.title !== 'Contact us' && section.title !== 'Report a problem',
);

export function SupportPageLayout() {
  const insets = useSafeAreaInsets();
  const { isCompact } = useResponsiveLayout();
  const reducedMotion = useReducedMotion();

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
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
    titleBlock: {
      gap: spacing.xs,
      marginBottom: isCompact ? spacing.md : spacing.lg,
    },
    title: {
      ...typography.title,
      fontSize: isCompact ? 28 : 32,
      lineHeight: isCompact ? 34 : 38,
      letterSpacing: -0.4,
      color: colors.labelPrimary,
    },
    intro: {
      ...typography.body,
      fontSize: isCompact ? 15 : 16,
      lineHeight: isCompact ? 24 : 26,
      color: colors.labelSecondary,
      marginBottom: isCompact ? spacing.lg : spacing.xl,
    },
    sectionEyebrow: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
      marginBottom: spacing.sm,
    },
    cardSubtitle: {
      ...typography.subtitle,
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 20 : 22,
      color: colors.labelSecondary,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: isCompact ? radii.lg : radii.xl,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: isCompact ? spacing.md : spacing.lg,
      marginBottom: isCompact ? spacing.lg : spacing.xl,
      gap: isCompact ? spacing.md : spacing.lg,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
  }));

  return (
    <PublicLegalPageShell>
      <ScrollView style={styles.page} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={enterFadeUp(PUBLIC_PAGE_STAGGER.header, reducedMotion)}>
          <PublicLegalPageHeader />
        </Animated.View>

        <Animated.View
          entering={enterFadeUp(PUBLIC_PAGE_STAGGER.title, reducedMotion)}
          style={styles.titleBlock}>
          <Text style={styles.title}>{SUPPORT_PAGE_CONTENT.title}</Text>
        </Animated.View>

        <Animated.View entering={enterFadeUp(PUBLIC_PAGE_STAGGER.title + 45, reducedMotion)}>
          <Text style={styles.intro}>{SUPPORT_PAGE_CONTENT.intro}</Text>
        </Animated.View>

        <Animated.View entering={enterFadeUp(PUBLIC_PAGE_STAGGER.toc, reducedMotion)}>
          <Text style={styles.sectionEyebrow}>Contact us</Text>
          <View style={styles.formCard}>
            <Text style={styles.cardSubtitle}>
              Send a message for bugs, account issues, or questions. We typically respond within one to two business days.
            </Text>
            <SupportContactForm />
          </View>
        </Animated.View>

        <Animated.View entering={enterFadeUp(PUBLIC_PAGE_STAGGER.content, reducedMotion)}>
          <SupportHelpTopics sections={FAQ_SECTIONS} />
        </Animated.View>

        {!isCompact ? (
          <Animated.View entering={enterFadeUp(PUBLIC_PAGE_STAGGER.footer, reducedMotion)}>
            <PublicSiteFooter links={getPublicLegalFooterLinks('support')} />
          </Animated.View>
        ) : null}
      </ScrollView>
    </PublicLegalPageShell>
  );
}
