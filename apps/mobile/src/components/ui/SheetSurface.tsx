import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { getElevationStyle, radii } from '@/theme/tokens';

type SheetSurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
};

/**
 * Solid panel for sheets and dialogs. Matches `SurfaceCard` (app surface, hairline border,
 * elevation) so menus read like the rest of the app. Liquid glass is reserved for floating chrome.
 */
export function SheetSurface({ children, style, borderRadius = radii.xl }: SheetSurfaceProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          backgroundColor: colors.surfaceElevated,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.separator,
        },
        getElevationStyle({ isDark, level: 'raised' }),
        style,
      ]}>
      {children}
    </View>
  );
}
