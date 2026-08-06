import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radii, useThemedStyles } from '@/theme';

type SurfaceWellProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Slightly tinted well surface (tier 2). */
  tinted?: boolean;
};

/** Large flat container — file-tab workspace, attention strips. No shadow. */
export function SurfaceWell({ children, style, contentStyle, tinted = true }: SurfaceWellProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    well: {
      borderRadius: radii.hero,
      backgroundColor: tinted ? colors.fillSubtle : colors.surface,
      padding: spacing.md,
      width: '100%',
      alignSelf: 'stretch' as const,
    },
    inner: {
      width: '100%',
    },
  }));

  return (
    <View style={[styles.well, style]}>
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </View>
  );
}
