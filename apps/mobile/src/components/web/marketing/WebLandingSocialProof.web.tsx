import { Text } from 'react-native';

import { WebMarketingSection } from '@/components/web/marketing/WebMarketingSection.web';
import { useThemedStyles } from '@/theme';

const TRUST_ITEMS = [
  'Made for Canadian dental teams',
  'Permanent roles & fill-ins',
  'Apply in one tap',
  'Start free',
] as const;

export function WebLandingSocialProof() {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    bleed: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: spacing.lg,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.separator,
    },
    line: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
      letterSpacing: 0.2,
      textAlign: 'center' as const,
    },
  }));

  return (
    <WebMarketingSection style={styles.bleed}>
      <Text style={styles.line}>{TRUST_ITEMS.join(' · ')}</Text>
    </WebMarketingSection>
  );
}
