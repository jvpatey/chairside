import { Children, ReactNode } from 'react';
import { View } from 'react-native';

import { RowDivider } from '@/components/clinic/DetailCard';
import { useThemedStyles } from '@/theme';
import { getElevationStyle } from '@/theme/tokens';

type ProfileSettingsGroupProps = {
  children: ReactNode;
};

export function ProfileSettingsGroup({ children }: ProfileSettingsGroupProps) {
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
  }));

  const items = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.card}>
      {items.map((child, index) => (
        <View key={index}>
          {child}
          {index < items.length - 1 ? <RowDivider /> : null}
        </View>
      ))}
    </View>
  );
}
