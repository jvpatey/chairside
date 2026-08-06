import type { ReactNode } from 'react';
import { View } from 'react-native';

import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { IS_WEB } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type DashboardBodyLayoutProps = {
  hero?: ReactNode;
  error?: ReactNode;
  needsAttention?: ReactNode;
  nextUp?: ReactNode;
  quickActions?: ReactNode;
  workspace: ReactNode;
  insights?: ReactNode;
  checklist?: ReactNode;
  messages?: ReactNode;
  alerts?: ReactNode;
  planUsage?: ReactNode;
};

function hasRenderableContent(node: ReactNode) {
  return node != null && node !== false;
}

/** Shared dashboard section ordering for phone, tablet, and wide web layouts. */
export function DashboardBodyLayout({
  hero,
  error,
  needsAttention,
  nextUp,
  quickActions,
  workspace,
  insights,
  checklist,
  messages,
  alerts,
  planUsage,
}: DashboardBodyLayoutProps) {
  const { isWide } = useResponsiveLayout();
  const useDesktopGrid = IS_WEB && isWide;
  const styles = useThemedStyles((theme) => getDashboardLayoutStyles(theme));

  const asideColumn = (
    <View style={styles.asideStack}>
      {planUsage}
      {insights}
      {messages}
      {checklist}
      {alerts}
    </View>
  );

  const hasAside =
    hasRenderableContent(planUsage) ||
    hasRenderableContent(insights) ||
    hasRenderableContent(messages) ||
    hasRenderableContent(checklist) ||
    hasRenderableContent(alerts);

  const attentionNextUp = hasRenderableContent(needsAttention) || hasRenderableContent(nextUp) ? (
    <View style={useDesktopGrid ? styles.attentionNextUpRow : styles.attentionNextUpStack}>
      {needsAttention}
      {nextUp}
    </View>
  ) : null;

  if (useDesktopGrid) {
    return (
      <View style={styles.desktopShell}>
        {hero}
        {quickActions}
        {error}
        {attentionNextUp}
        <View style={hasAside ? styles.desktopGrid : undefined}>
          <View style={hasAside ? styles.desktopMain : styles.desktopMainFull}>
            {workspace}
          </View>
          {hasAside ? <View style={styles.desktopAside}>{asideColumn}</View> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      {hero}
      {quickActions}
      {error}
      {attentionNextUp}
      {workspace}
      {planUsage}
      {insights}
      {checklist}
      {messages}
      {alerts}
    </View>
  );
}
