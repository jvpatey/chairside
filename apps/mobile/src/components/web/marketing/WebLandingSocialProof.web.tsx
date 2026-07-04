import { Text, View } from 'react-native';

import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useThemedStyles } from '@/theme';

const TRUST_ITEMS = [
  'Made for Canadian dental teams',
  'Same-day fill-ins',
  'Apply in one tap',
  'Start free',
] as const;

export function WebLandingSocialProof() {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    strip: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.separator,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
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
    <View style={styles.strip}>
      <Text style={styles.line}>{TRUST_ITEMS.join(' · ')}</Text>
    </View>
  );
}
