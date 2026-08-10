import type { ReactNode } from 'react';
import { View } from 'react-native';

import { DashboardAsideCompactProvider } from '@/components/dashboard/DashboardAsideCompactContext';
import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { IS_WEB } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type DashboardBodyLayoutProps = {
  hero?: ReactNode;
  error?: ReactNode;
  needsAttention?: ReactNode;
  calendar?: ReactNode;
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

function renderAsideMetaSection({
  planUsage,
  insights,
  styles,
  paired,
}: {
  planUsage?: ReactNode;
  insights?: ReactNode;
  styles: ReturnType<typeof getDashboardLayoutStyles>;
  paired: boolean;
}) {
  const hasPlan = hasRenderableContent(planUsage);
  const hasInsights = hasRenderableContent(insights);
  if (!hasPlan && !hasInsights) return null;

  if (paired && hasPlan && hasInsights) {
    return (
      <DashboardAsideCompactProvider compact>
        <View style={styles.asideMetaRow}>
          <View style={styles.asideMetaCell}>{planUsage}</View>
          <View style={styles.asideMetaCell}>{insights}</View>
        </View>
      </DashboardAsideCompactProvider>
    );
  }

  return (
    <>
      {planUsage}
      {insights}
    </>
  );
}

/** Shared dashboard section ordering for phone, tablet, and wide web layouts. */
export function DashboardBodyLayout({
  hero,
  error,
  needsAttention,
  calendar,
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

  const asideMeta = renderAsideMetaSection({
    planUsage,
    insights,
    styles,
    paired: useDesktopGrid,
  });

  const asideColumn = (
    <View style={styles.asideStack}>
      {messages}
      {calendar}
      {asideMeta}
      {checklist}
      {alerts}
    </View>
  );

  const hasAside =
    hasRenderableContent(planUsage) ||
    hasRenderableContent(insights) ||
    hasRenderableContent(calendar) ||
    hasRenderableContent(messages) ||
    hasRenderableContent(checklist) ||
    hasRenderableContent(alerts);

  // Don't wrap on phone — an empty wrapper still consumes flex `gap` and doubles
  // the space above Calendar when Needs attention has nothing to show.
  const attentionRow = hasRenderableContent(needsAttention)
    ? useDesktopGrid
      ? (
          <View style={styles.attentionNextUpRow}>{needsAttention}</View>
        )
      : (
          needsAttention
        )
    : null;

  if (useDesktopGrid) {
    return (
      <View style={styles.desktopShell}>
        {hero}
        {quickActions}
        {error}
        {attentionRow}
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
      {attentionRow}
      {IS_WEB ? calendar : null}
      {workspace}
      {!IS_WEB ? calendar : null}
      {messages}
      {planUsage}
      {insights}
      {checklist}
      {alerts}
    </View>
  );
}
