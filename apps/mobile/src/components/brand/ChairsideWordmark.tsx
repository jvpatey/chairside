import { Text, useWindowDimensions, View } from 'react-native';

import { fontWordmark } from '@/theme/fonts';
import { useTheme } from '@/theme';

type ChairsideWordmarkProps = {
  variant?: 'hero' | 'compact';
};

const COMPACT = { fontSize: 28, letterSpacing: -0.6 } as const;

function heroSize(screenWidth: number) {
  return Math.round(Math.max(52, Math.min(screenWidth * 0.14, 56)));
}

export function ChairsideWordmark({ variant = 'hero' }: ChairsideWordmarkProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const fontSize = variant === 'hero' ? heroSize(screenWidth) : COMPACT.fontSize;
  const letterSpacing =
    variant === 'hero' ? (fontSize >= 55 ? -1.4 : -1.2) : COMPACT.letterSpacing;

  return (
    <View accessibilityRole="header" accessibilityLabel="chairside">
      <Text
        style={{
          fontFamily: fontWordmark,
          fontSize,
          letterSpacing,
          textTransform: 'lowercase',
        }}>
        <Text style={{ color: colors.labelPrimary }}>chair</Text>
        <Text style={{ color: colors.primary }}>side</Text>
      </Text>
    </View>
  );
}
