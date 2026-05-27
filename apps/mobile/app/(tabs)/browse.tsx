import { listLiveJobPosts, listWorkerAppliedJobPostIds, type LiveJobPost } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { COMPACT_ROLE_TYPE_FILTER_OPTIONS, type RoleTypeFilter } from '@/lib/postingFilters';
import {
  buildLiveJobMatchDisplayContext,
  computeJobMatchBreakdown,
} from '@/lib/workerMatch';
import { getWorkerJobDetailRoute } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function BrowseEmptyState({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
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

export default function BrowseScreen() {
  const { user } = useAuth();
  const { workerProfile } = useWorkerProfile();
  const province = workerProfile?.province ?? 'NS';
  const [jobs, setJobs] = useState<LiveJobPost[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeFilter>('all');
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
    if (roleTypeFilter === 'all') return jobs;
    return jobs.filter((job) => job.role_type === roleTypeFilter);
  }, [jobs, roleTypeFilter]);

  const roleFilterOptions = COMPACT_ROLE_TYPE_FILTER_OPTIONS;

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: { gap: spacing.lg },
    list: { gap: spacing.md },
  }));

  return (
    <Screen title="Browse" subtitle="Open roles at clinics in your province.">
      <View style={styles.wrap}>
        <ChipSelector
          options={roleFilterOptions}
          selected={roleTypeFilter}
          onChange={(value) => setRoleTypeFilter(value as RoleTypeFilter)}
          horizontal
          compact
        />

        {filteredJobs.length === 0 && !isLoading ? (
          <BrowseEmptyState
            icon="briefcase-outline"
            title="No open roles"
            body="Check back soon for new opportunities in your province."
          />
        ) : (
          <View style={styles.list}>
            {filteredJobs.map((job) => (
              <RoleListingCard
                key={job.id}
                job={job}
                hasApplied={appliedJobIds.has(job.id)}
                jobMatch={workerProfile ? computeJobMatchBreakdown(workerProfile, job) : null}
                matchContext={
                  workerProfile ? buildLiveJobMatchDisplayContext(workerProfile, job) : undefined
                }
                onPress={() => router.push(getWorkerJobDetailRoute(job.id))}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
