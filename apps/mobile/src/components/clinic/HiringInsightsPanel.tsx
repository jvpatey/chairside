import { getClinicHiringInsights, type ClinicHiringInsights, type HiringInsightsMetrics } from '@chairside/api';
import { formatApplicationStatus } from '@chairside/config';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { PlanUpgradeCallout } from '@/components/billing/PlanUpgradeCallout';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useThemedStyles } from '@/theme';

type HiringInsightsPanelProps = {
  clinicId: string;
  locationIds?: string[] | null;
  canUseHiringInsights: boolean;
  showLocationBreakdown?: boolean;
  lockedMessage: string;
  onUpgrade: () => void;
};

function formatPipelineLabel(status: string): string {
  return formatApplicationStatus(status, 'job');
}

function InsightStat({ label, value }: { label: string; value: string | number }) {
  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    stat: {
      flex: 1,
      minWidth: 120,
      gap: spacing.xs,
    },
    value: {
      ...typography.body,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    label: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function MetricsGrid({ metrics }: { metrics: HiringInsightsMetrics }) {
  const styles = useThemedStyles(({ spacing }) => ({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    pipeline: {
      gap: spacing.xs,
    },
    pipelineRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    pipelineLabel: {
      flex: 1,
    },
    pipelineValue: {
      fontWeight: '600',
    },
  }));

  const pipelineEntries = useMemo(
    () =>
      Object.entries(metrics.pipeline)
        .filter(([, count]) => count > 0)
        .sort((left, right) => right[1] - left[1]),
    [metrics.pipeline],
  );

  return (
    <>
      <View style={styles.grid}>
        <InsightStat label="Open roles" value={metrics.openRoles} />
        <InsightStat label="Live fill-ins" value={metrics.liveFillIns} />
        <InsightStat label="Total applicants" value={metrics.totalApplicants} />
        <InsightStat label="New to review" value={metrics.newApplicants} />
        <InsightStat label="Outreach threads" value={metrics.outreachThreads} />
        <InsightStat label="Confirmed fill-ins" value={metrics.confirmedFillIns} />
        <InsightStat
          label="Avg days to 1st applicant"
          value={
            metrics.avgDaysToFirstApplicant != null
              ? metrics.avgDaysToFirstApplicant
              : '—'
          }
        />
      </View>

      {pipelineEntries.length > 0 ? (
        <View style={styles.pipeline}>
          <DashboardSectionHeader title="Applicant pipeline" />
          {pipelineEntries.map(([status, count]) => (
            <View key={status} style={styles.pipelineRow}>
              <Text style={styles.pipelineLabel}>{formatPipelineLabel(status)}</Text>
              <Text style={styles.pipelineValue}>{count}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
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

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    section: {
      gap: spacing.md,
    },
    card: {
      gap: spacing.md,
    },
    locationBlock: {
      gap: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    locationTitle: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 15,
    },
    helper: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    loading: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    error: {
      ...typography.subtitle,
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

  return (
    <View style={styles.section}>
      <DashboardSectionHeader title="Hiring insights" />
      <Text style={styles.helper}>
        Track pipeline health, outreach threads, and time-to-applicant.
      </Text>

      {!canUseHiringInsights ? (
        <PlanUpgradeCallout
          title="Unlock hiring insights"
          message={lockedMessage}
          onUpgrade={onUpgrade}
        />
        ) : isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : insights ? (
          <SurfaceCard style={styles.card}>
            <MetricsGrid metrics={insights} />

            {showLocationBreakdown && insights.byLocation.length > 0 ? (
              <>
                <Text style={styles.helper}>Per-location breakdown</Text>
                {insights.byLocation.map((location) => (
                  <View key={location.locationId} style={styles.locationBlock}>
                    <Text style={styles.locationTitle}>{location.locationName}</Text>
                    <MetricsGrid metrics={location.metrics} />
                  </View>
                ))}
              </>
            ) : null}
          </SurfaceCard>
        ) : null}
    </View>
  );
}
