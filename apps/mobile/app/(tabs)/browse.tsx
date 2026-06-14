import { listLiveJobPosts, listWorkerAppliedJobPostIds, type LiveJobPost } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { WorkerRoleBrowseFilters } from '@/components/clinic/PostingFilters';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { Screen } from '@/components/ui/Screen';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  ROLES_BROWSE_MODE_OPTIONS,
  sortJobsByPostedDate,
  type JobPostedSort,
  type RoleTypeFilter,
  type RolesBrowseMode,
} from '@/lib/postingFilters';
import { buildLiveJobMatchDisplayContext, computeJobMatchBreakdown } from '@/lib/workerMatch';
import { getWorkerJobDetailRoute } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function BrowseEmptyState({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.fillSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    title: { ...typography.body, fontWeight: '600', textAlign: 'center' },
    body: { ...typography.subtitle, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={colors.labelSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

function renderRoleListingCards(
  jobs: LiveJobPost[],
  appliedJobIds: Set<string>,
  workerProfile: ReturnType<typeof useWorkerProfile>['workerProfile'],
) {
  return jobs.map((job) => (
    <RoleListingCard
      key={job.id}
      job={job}
      layout="list"
      hasApplied={appliedJobIds.has(job.id)}
      jobMatch={workerProfile ? computeJobMatchBreakdown(workerProfile, job) : null}
      matchContext={workerProfile ? buildLiveJobMatchDisplayContext(workerProfile, job) : undefined}
      onPress={() => router.push(getWorkerJobDetailRoute(job.id))}
    />
  ));
}

export default function BrowseScreen() {
  const { user } = useAuth();
  const { workerProfile } = useWorkerProfile();
  const province = workerProfile?.province ?? 'NS';
  const [selectedMode, setSelectedMode] = useState<RolesBrowseMode>('open');
  const [jobs, setJobs] = useState<LiveJobPost[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [postedSort, setPostedSort] = useState<JobPostedSort>('newest');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jobRows, appliedIds] = await Promise.all([
        listLiveJobPosts(province),
        user?.id ? listWorkerAppliedJobPostIds(user.id) : Promise.resolve([]),
      ]);
      setJobs(jobRows);
      setAppliedJobIds(new Set(appliedIds));
    } catch {
      setJobs([]);
      setAppliedJobIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [province, user?.id]);

  useRefreshOnFocus(load);

  const filteredJobs = useMemo(() => {
    const byRole =
      roleTypeFilter === 'all' ? jobs : jobs.filter((job) => job.role_type === roleTypeFilter);
    return sortJobsByPostedDate(byRole, postedSort);
  }, [jobs, postedSort, roleTypeFilter]);

  const { openJobs, appliedJobs } = useMemo(() => {
    const open: LiveJobPost[] = [];
    const applied: LiveJobPost[] = [];

    for (const job of filteredJobs) {
      if (appliedJobIds.has(job.id)) {
        applied.push(job);
      } else {
        open.push(job);
      }
    }

    return { openJobs: open, appliedJobs: applied };
  }, [appliedJobIds, filteredJobs]);

  const hasBothSections = openJobs.length > 0 && appliedJobs.length > 0;
  const segmentJobs = selectedMode === 'open' ? openJobs : appliedJobs;

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: { gap: spacing.lg },
    panel: { gap: spacing.md },
  }));

  const showRoleFilters = !isLoading && jobs.length > 0;

  const roleListContent = hasBothSections ? (
    <View style={styles.panel}>
      <SegmentedControl
        options={ROLES_BROWSE_MODE_OPTIONS}
        selected={selectedMode}
        onChange={setSelectedMode}
        density="compact"
      />
      {segmentJobs.length === 0 ? (
        <DashboardEmptyState
          icon={selectedMode === 'open' ? 'briefcase-outline' : 'checkmark-circle-outline'}
          title={
            selectedMode === 'open'
              ? 'No open roles in this filter'
              : 'No applied roles in this filter'
          }
          message={
            selectedMode === 'open'
              ? 'Try a different filter or check the Applied tab.'
              : 'Roles you apply to will appear here while they are still posted.'
          }
        />
      ) : (
        <BrowseListGroup>
          {renderRoleListingCards(segmentJobs, appliedJobIds, workerProfile)}
        </BrowseListGroup>
      )}
    </View>
  ) : (
    <BrowseListGroup>
      {renderRoleListingCards(filteredJobs, appliedJobIds, workerProfile)}
    </BrowseListGroup>
  );

  return (
    <Screen
      title="Roles"
      subtitle="Open roles in your province."
      headerAccessory={
        showRoleFilters ? (
          <WorkerRoleBrowseFilters
            roleTypeFilter={roleTypeFilter}
            postedSort={postedSort}
            onRoleTypeChange={setRoleTypeFilter}
            onPostedSortChange={setPostedSort}
          />
        ) : undefined
      }
    >
      <View style={styles.wrap}>
        {isLoading ? (
          <PageLoadingList message="Loading roles…" />
        ) : jobs.length === 0 ? (
          <BrowseEmptyState
            icon="briefcase-outline"
            title="No open roles"
            body="Check back soon for new opportunities in your province."
          />
        ) : filteredJobs.length === 0 ? (
          <BrowseEmptyState
            icon="filter-outline"
            title="No roles in this filter"
            body="Try a different filter or check back soon for new opportunities."
          />
        ) : (
          roleListContent
        )}
      </View>
    </Screen>
  );
}
