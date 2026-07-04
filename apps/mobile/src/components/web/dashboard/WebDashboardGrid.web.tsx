import { ReactNode } from 'react';
import { View } from 'react-native';

import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { IS_WEB } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type WebDashboardGridProps = {
  hero?: ReactNode;
  main: ReactNode;
  aside: ReactNode;
};

/** @deprecated Use `DashboardBodyLayout` — kept for compatibility during migration. */
export function WebDashboardGrid({ hero, main, aside }: WebDashboardGridProps) {
  const { isWide } = useResponsiveLayout();
  const styles = useThemedStyles((theme) => getDashboardLayoutStyles(theme));

  if (!IS_WEB || !isWide) {
    return (
      <View style={styles.content}>
        {hero}
        {main}
        {aside}
      </View>
    );
  }

  return (
    <View style={styles.desktopShell}>
      {hero}
      <View style={styles.desktopGrid}>
        <View style={styles.desktopMain}>{main}</View>
        {aside ? <View style={styles.desktopAside}>{aside}</View> : null}
      </View>
    </View>
  );
}
