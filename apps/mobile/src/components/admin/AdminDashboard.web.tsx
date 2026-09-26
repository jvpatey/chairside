import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AdminStatsForbiddenError,
  fetchAdminStats,
  type AdminStatsPayload,
} from '@chairside/api';

import { AdminCollapsibleSection } from '@/components/admin/AdminCollapsibleSection';
import { AdminDeniedState } from '@/components/admin/AdminDeniedState';
import { AdminDirectoryPanel } from '@/components/admin/AdminDirectoryPanel';
import { AdminDistributionBars } from '@/components/admin/AdminDistributionBars';
import { AdminKpiCard } from '@/components/admin/AdminKpiCard';
import { AdminLoadingSkeleton } from '@/components/admin/AdminLoadingSkeleton';
import { AdminPlanStatusCard } from '@/components/admin/AdminPlanStatusCard';
import {
  formatAdminPlanLabel,
  formatAdminRelativeTime,
  formatAdminRoleLabel,
  getPlanAccent,
  getRoleBarColor,
} from '@/components/admin/adminLabels';
import { ChairsideBrandText } from '@/components/brand/ChairsideWordmark';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { getWebTabletContentTopPadding } from '@/lib/breakpoints';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { fontBold, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type LoadState =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: AdminStatsPayload };

export function AdminDashboard() {
  const { colors, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isTablet, isCompact } = useResponsiveLayout();
  const tabDockInset = useMobileTabDockInset();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const topPadding = isTablet
    ? getWebTabletContentTopPadding(insets.top)
    : insets.top + 16;
  const bottomPadding = Math.max(tabDockInset, 32) + 24;
  const stackMid = width < 900;
  const titleSize = isCompact ? 24 : 28;

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    scroll: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    content: {
      width: '100%',
      maxWidth: 1160,
      alignSelf: 'center',
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      flexWrap: 'wrap',
    },
    headerText: {
      gap: spacing.sm,
      flex: 1,
    },
    title: {
      fontFamily: fontBold,
      letterSpacing: -0.6,
      color: colors.labelPrimary,
    },
    titleSuffix: {
      fontFamily: fontBold,
      letterSpacing: -0.6,
      color: colors.labelPrimary,
    },
    subtitle: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.labelTertiary,
    },
    refreshBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      ...webPointer(),
    },
    refreshHovered: {
      backgroundColor: colors.fillSubtle,
    },
    refreshLabel: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.primary,
    },
    kpiRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    mid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      alignItems: 'stretch',
    },
  }));

  const contentStyle = [
    styles.content,
    {
      paddingHorizontal: isCompact ? spacing.md : spacing.lg,
      paddingTop: topPadding,
      paddingBottom: bottomPadding,
      gap: isCompact ? spacing.md : spacing.lg,
    },
  ];

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setState({ status: 'loading' });

    try {
      const data = await fetchAdminStats();
      setState({ status: 'ready', data });
    } catch (error) {
      if (error instanceof AdminStatsForbiddenError) {
        setState({ status: 'forbidden' });
      } else {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Could not load admin stats.',
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const roleItems = useMemo(() => {
    if (state.status !== 'ready') return [];
    return state.data.professionalsByRole.map((row, index) => ({
      key: row.role,
      label: formatAdminRoleLabel(row.role),
      count: row.count,
      color: getRoleBarColor(index, colors),
    }));
  }, [colors, state]);

  const planItems = useMemo(() => {
    if (state.status !== 'ready') return [];
    return state.data.planMix.map((row) => ({
      key: row.plan,
      label: formatAdminPlanLabel(row.plan),
      count: row.count,
      color: getPlanAccent(row.plan, colors).bar,
    }));
  }, [colors, state]);

  if (state.status === 'loading') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={contentStyle}>
        <AdminLoadingSkeleton compact={isCompact} />
      </ScrollView>
    );
  }

  if (state.status === 'forbidden') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={contentStyle}>
        <AdminDeniedState />
      </ScrollView>
    );
  }

  if (state.status === 'error') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={contentStyle}>
        <AdminDeniedState title="Couldn’t load stats" message={state.message} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry"
          onPress={() => void load(false)}
          style={({ hovered, pressed }) => [
            styles.refreshBtn,
            webHover(hovered, pressed, styles.refreshHovered),
          ]}>
          <Ionicons name="refresh" size={16} color={colors.primary} />
          <Text style={styles.refreshLabel}>Try again</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const { data } = state;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={contentStyle}>
      <FadeInSection>
        <View style={styles.header}>
          <View style={[styles.headerText, !isCompact && { minWidth: 220 }]}>
            <Text style={[styles.title, { fontSize: titleSize }]} accessibilityRole="header">
              <ChairsideBrandText variant="inherit" />
              <Text style={[styles.titleSuffix, { fontSize: titleSize }]}> Statistics</Text>
            </Text>
            <Text style={styles.subtitle}>
              Platform snapshot · Updated {formatAdminRelativeTime(data.generatedAt)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh stats"
            disabled={refreshing}
            onPress={() => void load(true)}
            style={({ hovered, pressed }) => [
              styles.refreshBtn,
              webHover(hovered, pressed, styles.refreshHovered),
              refreshing && { opacity: 0.6 },
            ]}>
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={styles.refreshLabel}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
          </Pressable>
        </View>
      </FadeInSection>

      <FadeInSection delayMs={40}>
        <AdminCollapsibleSection
          title="People"
          subtitle="Registered accounts across the platform">
          <View style={styles.kpiRow}>
            <AdminKpiCard
              label="Professionals"
              value={data.kpis.professionals}
              accent="primary"
              compact={isCompact}
            />
            <AdminKpiCard
              label="Clinics"
              value={data.kpis.clinics}
              accent="secondary"
              compact={isCompact}
            />
            <AdminKpiCard
              label="New accounts (7 days)"
              value={data.kpis.signups7d}
              accent="tertiary"
              hint="Pros + clinics"
              compact={isCompact}
            />
            <AdminKpiCard
              label="New accounts (30 days)"
              value={data.kpis.signups30d}
              accent="warning"
              hint="Pros + clinics"
              compact={isCompact}
            />
          </View>
        </AdminCollapsibleSection>
      </FadeInSection>

      <FadeInSection delayMs={70}>
        <AdminCollapsibleSection
          title="Hiring"
          subtitle="Role posts and fill-in coverage">
          <View style={styles.kpiRow}>
            <AdminKpiCard
              label="Open roles"
              value={data.kpis.openRoles}
              accent="primary"
              hint="Live job posts"
              compact={isCompact}
            />
            <AdminKpiCard
              label="Roles filled"
              value={data.kpis.filledRoles}
              accent="secondary"
              hint="Filled job posts"
              compact={isCompact}
            />
            <AdminKpiCard
              label="Live fill-ins"
              value={data.kpis.liveFillIns}
              accent="tertiary"
              compact={isCompact}
            />
            <AdminKpiCard
              label="Fill-ins filled"
              value={data.kpis.filledFillIns}
              accent="warning"
              hint="Confirmed cover"
              compact={isCompact}
            />
          </View>
        </AdminCollapsibleSection>
      </FadeInSection>

      <FadeInSection delayMs={100}>
        <AdminCollapsibleSection title="Breakdown" subtitle="Role mix and clinic plans">
          <View style={[styles.mid, stackMid && { flexDirection: 'column' }]}>
            <AdminDistributionBars
              title="Professionals by role"
              items={roleItems}
              showPercent={false}
              compact={isCompact || stackMid}
            />
            <AdminPlanStatusCard
              planItems={planItems}
              statusItems={data.statusMix}
              compact={isCompact || stackMid}
            />
          </View>
        </AdminCollapsibleSection>
      </FadeInSection>

      <FadeInSection delayMs={150}>
        <AdminCollapsibleSection
          title="Directory"
          subtitle="Browse clinics and professionals">
          <AdminDirectoryPanel clinics={data.clinics} professionals={data.professionals} />
        </AdminCollapsibleSection>
      </FadeInSection>
    </ScrollView>
  );
}
