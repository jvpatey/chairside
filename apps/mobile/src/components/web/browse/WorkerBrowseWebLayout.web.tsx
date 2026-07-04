import { ReactNode } from 'react';
import { View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

type WorkerBrowseWebLayoutProps = {
  list: ReactNode;
  map?: ReactNode;
  showMap?: boolean;
};

/** Side-by-side list and map on wide web when map mode is active. */
export function WorkerBrowseWebLayout({ list, map, showMap = false }: WorkerBrowseWebLayoutProps) {
  const { isWide } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    split: {
      flexDirection: 'row' as const,
      gap: spacing.lg,
      minHeight: 520,
    },
    listPane: {
      flex: 1,
      minWidth: 0,
    },
    mapPane: {
      flex: 1,
      minWidth: 0,
      borderRadius: 20,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: colors.separator,
    },
  }));

  if (!isWide || !showMap || !map) {
    return <>{list}</>;
  }

  return (
    <View style={styles.split}>
      <View style={styles.listPane}>{list}</View>
      <View style={styles.mapPane}>{map}</View>
    </View>
  );
}
