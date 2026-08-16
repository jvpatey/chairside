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
  /** Group locations glance — sits after needsAttention in the main path. */
  alerts?: ReactNode;
  calendar?: ReactNode;
  /** Unfilled fill-ins this week — after calendar. */
  coverage?: ReactNode;
  quickActions?: ReactNode;
  workspace: ReactNode;
  insights?: ReactNode;
  checklist?: ReactNode;
  messages?: ReactNode;
  /** Owner team pulse — after messages. */
  teamPulse?: ReactNode;
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
  alerts,
  calendar,
  coverage,
  quickActions,
  workspace,
  insights,
  checklist,
  messages,
  teamPulse,
  planUsage,
}: DashboardBodyLayoutProps) {
  const { isWide } = useResponsiveLayout();
  const useDesktopGrid = IS_WEB && isWide;
  const styles = useThemedStyles((theme) => getDashboardLayoutStyles(theme));

  // Web aside: insights first (Pro perk), then messages/team, calendar/coverage, plan usage.
  const asideColumn = (
    <View style={styles.asideStack}>
      {insights}
      {messages}
      {teamPulse}
      {calendar}
      {coverage}
      {planUsage}
      {checklist}
    </View>
  );

  const hasAside =
    hasRenderableContent(planUsage) ||
    hasRenderableContent(insights) ||
    hasRenderableContent(calendar) ||
    hasRenderableContent(coverage) ||
    hasRenderableContent(messages) ||
    hasRenderableContent(teamPulse) ||
    hasRenderableContent(checklist);

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
        {alerts}
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
      {alerts}
      {IS_WEB ? calendar : null}
      {IS_WEB ? coverage : null}
      {workspace}
      {!IS_WEB ? calendar : null}
      {!IS_WEB ? coverage : null}
      {messages}
      {teamPulse}
      {planUsage}
      {insights}
      {checklist}
    </View>
  );
}
