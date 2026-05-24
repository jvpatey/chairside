import { listLiveJobPosts, listLiveShiftPosts, type LiveJobPost, type LiveShiftPost } from '@chairside/api';
import { ROLE_TYPE_OPTIONS } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { PostingsTabBar, type PostingsTab } from '@/components/clinic/PostingsTabBar';
import { ChipSelector } from '@/components/clinic/ChipSelector';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { Screen } from '@/components/ui/Screen';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { computeListingMatchScore } from '@/lib/workerMatch';
import {
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

type RoleTypeFilter = 'all' | string;

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
  const { workerProfile } = useWorkerProfile();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const province = workerProfile?.province ?? 'NS';
  const [jobs, setJobs] = useState<LiveJobPost[]>([]);
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [selectedTab, setSelectedTab] = useState<PostingsTab>('roles');
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tab === 'fill-ins') setSelectedTab('fill-ins');
  }, [tab]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jobRows, shiftRows] = await Promise.all([
        listLiveJobPosts(province),
        listLiveShiftPosts(province),
      ]);
      setJobs(jobRows);
      setShifts(shiftRows);
    } catch {
      setJobs([]);
      setShifts([]);
    } finally {
      setIsLoading(false);
    }
  }, [province]);

  useRefreshOnFocus(load);

  const filteredJobs = useMemo(() => {
    if (roleTypeFilter === 'all') return jobs;
    return jobs.filter((job) => job.role_type === roleTypeFilter);
  }, [jobs, roleTypeFilter]);

  const filteredShifts = useMemo(() => {
    if (roleTypeFilter === 'all') return shifts;
    return shifts.filter((shift) => shift.role_type === roleTypeFilter);
  }, [shifts, roleTypeFilter]);

  const roleFilterOptions = [{ value: 'all', label: 'All roles' }, ...ROLE_TYPE_OPTIONS];

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: { gap: spacing.lg },
    list: { gap: spacing.md },
    filters: { gap: spacing.sm },
  }));

  return (
    <Screen title="Browse" subtitle={`Live roles and fill-ins in ${province}.`}>
      <View style={styles.wrap}>
        <PostingsTabBar
          selected={selectedTab}
          roleCount={filteredJobs.length}
          fillInCount={filteredShifts.length}
          onChange={setSelectedTab}
        />
        <View style={styles.filters}>
          <ChipSelector
            options={roleFilterOptions}
            selected={roleTypeFilter}
            onChange={(value) => setRoleTypeFilter(value as RoleTypeFilter)}
          />
        </View>

        {selectedTab === 'roles' ? (
          filteredJobs.length === 0 && !isLoading ? (
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
                  matchScore={computeListingMatchScore(workerProfile, job)}
                  onPress={() => router.push(getWorkerJobDetailRoute(job.id))}
                />
              ))}
            </View>
          )
        ) : null}

        {selectedTab === 'fill-ins' ? (
          filteredShifts.length === 0 && !isLoading ? (
            <BrowseEmptyState
              icon="calendar-outline"
              title="No fill-in shifts"
              body="Urgent shifts will appear here when clinics post them."
            />
          ) : (
            <View style={styles.list}>
              {filteredShifts.map((shift) => (
                <FillInListingCard
                  key={shift.id}
                  shift={shift}
                  matchScore={computeListingMatchScore(workerProfile, shift)}
                  onPress={() => router.push(getWorkerShiftDetailRoute(shift.id))}
                />
              ))}
            </View>
          )
        ) : null}
      </View>
    </Screen>
  );
}
