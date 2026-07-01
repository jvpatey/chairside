import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPublicLegalFooterLinks, PublicSiteFooter } from '@/components/legal/PublicSiteFooter';
import { PublicLegalPageHeader } from '@/components/legal/PublicLegalPageHeader';
import { PublicLegalPageShell } from '@/components/legal/PublicLegalPageShell';
import { PublicPageCardHeader } from '@/components/legal/PublicPageCardHeader';
import { SupportContactForm } from '@/components/support/SupportContactForm';
import { SupportHelpTopics } from '@/components/support/SupportHelpTopics';
import { LEGAL_LAST_UPDATED } from '@/constants/legal';
import { SUPPORT_PAGE_CONTENT } from '@/content/legal/support';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useThemedStyles } from '@/theme';

const FAQ_SECTIONS = SUPPORT_PAGE_CONTENT.sections.filter(
  (section) => section.title !== 'Contact us' && section.title !== 'Report a problem',
);

export function SupportPageLayout() {
  const insets = useSafeAreaInsets();
  const { isCompact } = useResponsiveLayout();
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
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: isCompact ? 12 : 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: isCompact ? spacing.md : spacing.lg,
      marginBottom: isCompact ? spacing.lg : spacing.xl,
      gap: isCompact ? spacing.md : spacing.lg,
    },
  }));

  return (
    <PublicLegalPageShell>
      <ScrollView style={styles.page} contentContainerStyle={styles.scrollContent}>
      <PublicLegalPageHeader />

      <Text style={styles.title}>{SUPPORT_PAGE_CONTENT.title}</Text>
      <Text style={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</Text>
      <Text style={styles.intro}>{SUPPORT_PAGE_CONTENT.intro}</Text>

      <View style={styles.formCard}>
        <PublicPageCardHeader
          icon="mail-outline"
          title="Contact us"
          subtitle="Send a message for bugs, account issues, or questions. We typically respond within one to two business days."
        />
        <SupportContactForm />
      </View>

      <SupportHelpTopics sections={FAQ_SECTIONS} />

      {!isCompact ? (
        <PublicSiteFooter links={getPublicLegalFooterLinks('support')} />
      ) : null}
      </ScrollView>
    </PublicLegalPageShell>
  );
}
