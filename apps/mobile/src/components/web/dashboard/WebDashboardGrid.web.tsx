import { ReactNode } from 'react';
import { View } from 'react-native';

import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

type WebDashboardGridProps = {
  main: ReactNode;
  aside: ReactNode;
};

/** Arranges dashboard content in a two-column grid on wide web viewports. */
export function WebDashboardGrid({ main, aside }: WebDashboardGridProps) {
  const { isWide } = useResponsiveLayout();
  const styles = useThemedStyles((theme) => getDashboardLayoutStyles(theme));

  if (!isWide) {
    return (
      <View style={styles.content}>
        {main}
        {aside}
      </View>
    );
  }

  return (
    <View style={styles.desktopGrid}>
      <View style={styles.desktopMain}>{main}</View>
      {aside ? <View style={styles.desktopAside}>{aside}</View> : null}
    </View>
  );
}
