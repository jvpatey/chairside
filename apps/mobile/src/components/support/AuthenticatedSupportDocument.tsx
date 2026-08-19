import { Text, View } from 'react-native';

import { PublicPageCardHeader } from '@/components/legal/PublicPageCardHeader';
import type { AuthenticatedLegalPaths } from '@/components/legal/AuthenticatedLegalDocument';
import { SupportContactForm } from '@/components/support/SupportContactForm';
import { SupportHelpTopics } from '@/components/support/SupportHelpTopics';
import { SUPPORT_PAGE_CONTENT } from '@/content/legal/support';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';
import { getElevationStyle, radii } from '@/theme/tokens';

const FAQ_SECTIONS = SUPPORT_PAGE_CONTENT.sections.filter(
  (section) => section.title !== 'Contact us' && section.title !== 'Report a problem',
);

type AuthenticatedSupportDocumentProps = {
  legalPaths: AuthenticatedLegalPaths;
};

/** Support body for signed-in profile stacks (no public chrome / wordmark). */
export function AuthenticatedSupportDocument({ legalPaths }: AuthenticatedSupportDocumentProps) {
  const { isCompact } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    root: {
      gap: isCompact ? spacing.md : spacing.lg,
      paddingBottom: spacing.lg,
    },
    intro: {
      ...typography.body,
      fontSize: isCompact ? 15 : 16,
      lineHeight: isCompact ? 24 : 26,
      color: colors.labelSecondary,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: isCompact ? radii.lg : radii.xl,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: isCompact ? spacing.md : spacing.lg,
      gap: isCompact ? spacing.md : spacing.lg,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
  }));

  return (
    <View style={styles.root}>
      <Text style={styles.intro}>{SUPPORT_PAGE_CONTENT.intro}</Text>

      <View style={styles.formCard}>
        <PublicPageCardHeader
          icon="mail-outline"
          title="Contact us"
          subtitle="Send a message for bugs, account issues, or questions. We typically respond within one to two business days."
        />
        <SupportContactForm />
      </View>

      <SupportHelpTopics sections={FAQ_SECTIONS} legalPaths={legalPaths} />
    </View>
  );
}
