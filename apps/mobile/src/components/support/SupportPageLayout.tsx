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
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useThemedStyles } from '@/theme';

const FAQ_SECTIONS = SUPPORT_PAGE_CONTENT.sections.filter(
  (section) => section.title !== 'Contact us' && section.title !== 'Report a problem',
);

export function SupportPageLayout() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    page: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      paddingBottom: insets.bottom + spacing.xl,
      alignSelf: 'center' as const,
      width: '100%' as const,
      maxWidth: CONTENT_MAX_WIDTH.regular,
    },
    title: {
      ...typography.title,
      fontSize: 32,
      lineHeight: 38,
      marginBottom: spacing.xs,
      color: colors.labelPrimary,
    },
    updated: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.labelTertiary,
      marginBottom: spacing.lg,
    },
    intro: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 26,
      color: colors.labelSecondary,
      marginBottom: spacing.xl,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      gap: spacing.lg,
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

      <PublicSiteFooter links={getPublicLegalFooterLinks('support')} />
      </ScrollView>
    </PublicLegalPageShell>
  );
}
