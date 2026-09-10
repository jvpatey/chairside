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
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { fontBold, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type LoadState =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: AdminStatsPayload };

export function AdminDashboard() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    scroll: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    content: {
      width: '100%',
      maxWidth: 1160,
      alignSelf: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl * 2,
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
      minWidth: 220,
    },
    title: {
      fontFamily: fontBold,
      fontSize: 28,
      letterSpacing: -0.6,
      color: colors.labelPrimary,
    },
    titleSuffix: {
      fontFamily: fontBold,
      fontSize: 28,
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
      gap: spacing.md,
    },
    mid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      alignItems: 'stretch',
    },
  }));

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

  const stackMid = width < 900;

  if (state.status === 'loading') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <AdminLoadingSkeleton />
      </ScrollView>
    );
  }

  if (state.status === 'forbidden') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <AdminDeniedState />
      </ScrollView>
    );
  }

  if (state.status === 'error') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <FadeInSection>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title} accessibilityRole="header">
              <ChairsideBrandText variant="inherit" />
              <Text style={styles.titleSuffix}> Statistics</Text>
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
            <AdminKpiCard label="Professionals" value={data.kpis.professionals} accent="primary" />
            <AdminKpiCard label="Clinics" value={data.kpis.clinics} accent="secondary" />
            <AdminKpiCard
              label="New accounts (7 days)"
              value={data.kpis.signups7d}
              accent="tertiary"
              hint="Pros + clinics"
            />
            <AdminKpiCard
              label="New accounts (30 days)"
              value={data.kpis.signups30d}
              accent="warning"
              hint="Pros + clinics"
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
            />
            <AdminKpiCard
              label="Roles filled"
              value={data.kpis.filledRoles}
              accent="secondary"
              hint="Filled job posts"
            />
            <AdminKpiCard
              label="Live fill-ins"
              value={data.kpis.liveFillIns}
              accent="tertiary"
            />
            <AdminKpiCard
              label="Fill-ins filled"
              value={data.kpis.filledFillIns}
              accent="warning"
              hint="Confirmed cover"
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
            />
            <AdminPlanStatusCard planItems={planItems} statusItems={data.statusMix} />
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
