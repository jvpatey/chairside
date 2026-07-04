import type { ReactNode } from 'react';
import { View } from 'react-native';

import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { IS_WEB } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type DashboardBodyLayoutProps = {
  hero?: ReactNode;
  error?: ReactNode;
  spotlight?: ReactNode;
  statCards: ReactNode;
  quickActions: ReactNode;
  overview: ReactNode;
  checklist?: ReactNode;
  messages?: ReactNode;
  alerts?: ReactNode;
};

function hasRenderableContent(node: ReactNode) {
  return node != null && node !== false;
}

/** Shared dashboard section ordering for phone, tablet, and wide web layouts. */
export function DashboardBodyLayout({
  hero,
  error,
  spotlight,
  statCards,
  quickActions,
  overview,
  checklist,
  messages,
  alerts,
}: DashboardBodyLayoutProps) {
  const { isWide } = useResponsiveLayout();
  const useDesktopGrid = IS_WEB && isWide;
  const styles = useThemedStyles((theme) => getDashboardLayoutStyles(theme));

  const asideColumn = (
    <View style={styles.asideStack}>
      {messages}
      {checklist}
      {alerts}
    </View>
  );

  const hasAside =
    hasRenderableContent(messages) ||
    hasRenderableContent(checklist) ||
    hasRenderableContent(alerts);

  const phoneColumn = (
    <>
      {error}
      {spotlight}
      {statCards}
      {overview}
      {checklist}
      {messages}
      {alerts}
    </>
  );

  if (useDesktopGrid) {
    return (
      <View style={styles.desktopShell}>
        {hero}
        {quickActions}
        {error}
        {spotlight}
        {statCards}
        {overview}
        {hasAside ? <View style={styles.desktopSupplementary}>{asideColumn}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.content}>
      {hero}
      {quickActions}
      {phoneColumn}
    </View>
  );
}
