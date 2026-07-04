import { Text, View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { useTheme, useThemedStyles } from '@/theme';

const TRUST_ITEMS = [
  'Built for Canadian dental teams',
  'Screening & match scoring',
  'In-app messaging',
  'Same-day fill-ins',
] as const;

export function WebLandingSocialProof() {
  const { colors } = useTheme();
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    strip: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: isWide ? spacing.xl : spacing.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.separator,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
    item: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
      letterSpacing: 0.2,
    },
  }));

  return (
    <View style={styles.strip}>
      {TRUST_ITEMS.map((item) => (
        <Text key={item} style={styles.item}>
          {item}
        </Text>
      ))}
    </View>
  );
}
