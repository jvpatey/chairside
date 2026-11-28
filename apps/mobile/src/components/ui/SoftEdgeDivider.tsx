import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

type SoftEdgeDividerProps = {
  style?: StyleProp<ViewStyle>;
};

/** Hairline that fades at both ends, with a soft brand-blue peak in the center. */
export function SoftEdgeDivider({ style }: SoftEdgeDividerProps) {
  const { colors, isDark } = useTheme();
  const edge = colorWithAlpha(colors.labelPrimary, isDark ? 0.1 : 0.07);
  const mid = colorWithAlpha(colors.primary, isDark ? 0.42 : 0.32);

  const styles = useThemedStyles(() => ({
    line: {
      height: Platform.OS === 'web' ? 1 : StyleSheet.hairlineWidth,
      width: '100%' as const,
      alignSelf: 'stretch' as const,
    },
  }));

  return (
    <LinearGradient
      pointerEvents="none"
      colors={['transparent', edge, mid, edge, 'transparent']}
      locations={[0, 0.18, 0.5, 0.82, 1]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.line, style]}
    />
  );
}
