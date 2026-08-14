import {
  getClinicHiringInsights,
  type ClinicHiringInsights,
  type HiringInsightsMetrics,
} from '@chairside/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PlanUpgradeCallout } from '@/components/billing/PlanUpgradeCallout';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { DashboardWidgetHeader } from '@/components/dashboard/DashboardWidgetHeader';
import {
  buildHiringPipelineStages,
  getHiringPipelineActiveStages,
  getHiringPipelineProgress,
  getHiringSpeedDisplay,
  type HiringPipelineStageCount,
  type HiringPipelineStageId,
} from '@/lib/hiringInsightsDisplay';
import { colorWithAlpha, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type HiringInsightsPanelProps = {
  clinicId: string;
  locationIds?: string[] | null;
  canUseHiringInsights: boolean;
  showLocationBreakdown?: boolean;
  lockedMessage?: string;
  onUpgrade?: () => void;
};

function stageAccent(
  id: HiringPipelineStageId,
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    labelTertiary: string;
    warning: string;
  },
): string {
  switch (id) {
    case 'applied':
      return colors.primary;
    case 'in_review':
      return colors.warning;
    case 'interview':
      return colors.secondary;
    case 'hired':
      return colors.tertiary;
    case 'closed':
      return colors.labelTertiary;
  }
}

function HeroKpi({
  value,
  label,
  emphasize,
}: {
  value: string | number;
  label: string;
  emphasize?: boolean;
}) {
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    tile: {
      flex: 1,
      minWidth: 0,
      gap: 2,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: emphasize
        ? colorWithAlpha(colors.primary, 0.08)
        : colors.backgroundGrouped,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: emphasize ? colorWithAlpha(colors.primary, 0.22) : colors.separator,
      borderLeftWidth: emphasize ? 3 : StyleSheet.hairlineWidth,
      borderLeftColor: emphasize ? colors.primary : colors.separator,
    },
    value: {
      fontSize: 22,
      lineHeight: 28,
      fontFamily: fontSemibold,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.tile}>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function PipelineSegmentBar({ stages }: { stages: HiringPipelineStageCount[] }) {
  const { colors } = useTheme();
  const active = getHiringPipelineActiveStages(stages);
  const total = active.reduce((sum, stage) => sum + stage.count, 0);

  const styles = useThemedStyles(({ colors, radii }) => ({
    track: {
      flexDirection: 'row',
      height: 10,
      borderRadius: radii.sm,
      overflow: 'hidden',
      backgroundColor: colors.fillSubtle,
    },
    segment: {
      height: '100%',
    },
  }));

  if (total === 0) return null;

  return (
    <View style={styles.track} accessibilityRole="progressbar">
      {active.map((stage) => (
        <View
          key={stage.id}
          style={[
            styles.segment,
            {
              flex: stage.count,
              backgroundColor: stageAccent(stage.id, colors),
              opacity: stage.muted ? 0.45 : 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

function PipelineStageRow({
  stage,
  colors,
}: {
  stage: HiringPipelineStageCount;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    labelTertiary: string;
    warning: string;
    fillSubtle: string;
    labelPrimary: string;
    labelSecondary: string;
  };
}) {
  const accent = stageAccent(stage.id, colors);
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      gap: spacing.xs,
    },
    meta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    label: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: stage.muted ? colors.labelTertiary : colors.labelPrimary,
    },
    count: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '700',
      color: stage.muted ? colors.labelTertiary : colors.labelPrimary,
    },
    track: {
      height: 6,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: colors.fillSubtle,
    },
    fill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: accent,
      opacity: stage.muted ? 0.45 : 1,
      width: `${Math.max(Math.round(stage.share * 100), stage.count > 0 ? 4 : 0)}%`,
    },
  }));

  return (
    <View style={styles.row}>
      <View style={styles.meta}>
        <Text style={styles.label}>{stage.label}</Text>
        <Text style={styles.count}>{stage.count}</Text>
      </View>
      <View style={styles.track}>
        <View style={styles.fill} />
      </View>
    </View>
  );
}

function OpsCell({ label, value }: { label: string; value: number }) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    cell: {
      flexGrow: 1,
      flexBasis: '42%',
      minWidth: 96,
      gap: 2,
      paddingVertical: spacing.xs,
    },
    value: {
      fontSize: 16,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    label: {
      fontSize: 11,
      lineHeight: 14,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.cell}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function InsightsBody({
  metrics,
  showLocationBreakdown,
  byLocation,
}: {
  metrics: HiringInsightsMetrics;
  showLocationBreakdown: boolean;
  byLocation: ClinicHiringInsights['byLocation'];
}) {
  const { colors } = useTheme();
  const stages = useMemo(
    () => buildHiringPipelineStages(metrics.pipeline, metrics.totalApplicants),
    [metrics.pipeline, metrics.totalApplicants],
  );
  const progress = useMemo(
    () => getHiringPipelineProgress(stages, metrics.totalApplicants),
    [stages, metrics.totalApplicants],
  );
  const speed = getHiringSpeedDisplay(metrics.avgDaysToHire, metrics.avgDaysToFirstApplicant);
  const hasPipeline = metrics.totalApplicants > 0;

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    body: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    heroRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    funnelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    funnelCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    funnelTitle: {
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    funnelMeta: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
    stageList: {
      gap: spacing.sm,
    },
    empty: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    opsStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    locationBlock: {
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    locationTitle: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    locationStats: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    locationStat: {
      gap: 1,
    },
    locationStatValue: {
      fontSize: 15,
      lineHeight: 18,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    locationStatLabel: {
      fontSize: 11,
      lineHeight: 14,
      color: colors.labelSecondary,
    },
    weekHint: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelTertiary,
    },
  }));

  return (
    <View style={styles.body}>
      <View style={styles.heroRow}>
        <HeroKpi
          value={metrics.newApplicants}
          label="New to review"
          emphasize={metrics.newApplicants > 0}
        />
        <HeroKpi value={metrics.interviewsOpen} label="Interviews open" />
        <HeroKpi value={speed.value} label={speed.label} />
      </View>

      {metrics.newApplicants7d > 0 ? (
        <Text style={styles.weekHint}>{metrics.newApplicants7d} new applicants in the last 7 days</Text>
      ) : null}

      <View style={styles.funnelHeader}>
        <ProgressRing
          completed={progress.completed}
          total={Math.max(progress.total, 1)}
          size={44}
          strokeWidth={4}
          color={colors.primary}
          accessibilityLabel={`${progress.completed} of ${progress.total} applicants past applied`}
        />
        <View style={styles.funnelCopy}>
          <Text style={styles.funnelTitle}>Applicant pipeline</Text>
          <Text style={styles.funnelMeta}>
            {hasPipeline
              ? `${Math.round(progress.progress * 100)}% past applied · ${metrics.totalApplicants} total`
              : 'No applicants yet'}
          </Text>
        </View>
      </View>

      {hasPipeline ? (
        <>
          <PipelineSegmentBar stages={stages} />
          <View style={styles.stageList}>
            {stages.map((stage) => (
              <PipelineStageRow key={stage.id} stage={stage} colors={colors} />
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.empty}>Applications will appear here as candidates apply.</Text>
      )}

      <View style={styles.opsStrip}>
        <OpsCell label="Open roles" value={metrics.openRoles} />
        <OpsCell label="Live fill-ins" value={metrics.liveFillIns} />
        <OpsCell label="Outreach threads" value={metrics.outreachThreads} />
        <OpsCell label="Confirmed fill-ins" value={metrics.confirmedFillIns} />
        <OpsCell label="Pending fill-in requests" value={metrics.pendingFillInRequests} />
      </View>

      {showLocationBreakdown && byLocation.length > 0
        ? byLocation.map((location) => {
            const locationStages = buildHiringPipelineStages(
              location.metrics.pipeline,
              location.metrics.totalApplicants,
            );
            return (
              <View key={location.locationId} style={styles.locationBlock}>
                <Text style={styles.locationTitle}>{location.locationName}</Text>
                <View style={styles.locationStats}>
                  <View style={styles.locationStat}>
                    <Text style={styles.locationStatValue}>{location.metrics.newApplicants}</Text>
                    <Text style={styles.locationStatLabel}>New</Text>
                  </View>
                  <View style={styles.locationStat}>
                    <Text style={styles.locationStatValue}>{location.metrics.interviewsOpen}</Text>
                    <Text style={styles.locationStatLabel}>Interviews</Text>
                  </View>
                  <View style={styles.locationStat}>
                    <Text style={styles.locationStatValue}>{location.metrics.openRoles}</Text>
                    <Text style={styles.locationStatLabel}>Open roles</Text>
                  </View>
                </View>
                <PipelineSegmentBar stages={locationStages} />
              </View>
            );
          })
        : null}
    </View>
  );
}

export function HiringInsightsPanel({
  clinicId,
  locationIds,
  canUseHiringInsights,
  showLocationBreakdown = false,
  lockedMessage,
  onUpgrade,
}: HiringInsightsPanelProps) {
  const [insights, setInsights] = useState<ClinicHiringInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
    },
    loading: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    error: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 14,
      color: colors.destructive,
    },
  }));

  const loadInsights = useCallback(async () => {
    if (!canUseHiringInsights) {
      setInsights(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getClinicHiringInsights({
        clinicId,
        locationIds,
      });
      setInsights(data);
    } catch (loadError) {
      setInsights(null);
      setError(loadError instanceof Error ? loadError.message : 'Could not load hiring insights.');
    } finally {
      setIsLoading(false);
    }
  }, [canUseHiringInsights, clinicId, locationIds]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  if (!canUseHiringInsights) {
    return (
      <PlanUpgradeCallout
        title="Unlock hiring insights"
        message={lockedMessage ?? ''}
        onUpgrade={onUpgrade}
      />
    );
  }

  return (
    <View style={styles.card}>
      <DashboardWidgetHeader title="Hiring insights" icon="analytics-outline" accent="primary" />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : insights ? (
        <InsightsBody
          metrics={insights}
          showLocationBreakdown={showLocationBreakdown}
          byLocation={insights.byLocation}
        />
      ) : null}
    </View>
  );
}
