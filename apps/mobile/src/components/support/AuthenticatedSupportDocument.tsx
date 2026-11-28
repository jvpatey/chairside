import { Text, View } from 'react-native';

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
    sectionEyebrow: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
    contactBlock: {
      gap: spacing.sm,
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
      gap: isCompact ? spacing.md : spacing.lg,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
  }));

  return (
    <View style={styles.root}>
      <Text style={styles.intro}>{SUPPORT_PAGE_CONTENT.intro}</Text>

      <View style={styles.contactBlock}>
        <Text style={styles.sectionEyebrow}>Contact us</Text>
        <View style={styles.formCard}>
          <Text style={styles.cardSubtitle}>
            Send a message for bugs, account issues, or questions. We typically respond within one to two business days.
          </Text>
          <SupportContactForm />
        </View>
      </View>

      <SupportHelpTopics sections={FAQ_SECTIONS} legalPaths={legalPaths} />
    </View>
  );
}
