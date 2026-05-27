import type { ReactNode } from 'react';
import { View } from 'react-native';

import { badgeRowGap } from '@/components/ui/PillBadge';
import { useThemedStyles } from '@/theme';

type BadgeRowProps = {
  children: ReactNode;
};

export function BadgeRow({ children }: BadgeRowProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: badgeRowGap,
    },
  }));

  return <View style={styles.row}>{children}</View>;
}
