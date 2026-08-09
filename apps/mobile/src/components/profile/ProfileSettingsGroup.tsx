import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemedStyles } from '@/theme';
import { getElevationStyle } from '@/theme/tokens';

type ProfileSettingsGroupProps = {
  children: ReactNode;
};

export function ProfileSettingsGroup({ children }: ProfileSettingsGroupProps) {
  const styles = useThemedStyles(({ colors, spacing, radii, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
  }));

  const items = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.card}>
      {items.map((child, index) => (
        <View key={index}>{child}</View>
      ))}
    </View>
  );
}
