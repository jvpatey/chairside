import {
  listLiveShiftPosts,
  listWorkerShiftApplications,
  type LiveShiftPost,
  type WorkerApplication,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AvailabilityScheduleSummary } from '@/components/worker/AvailabilityScheduleSummary';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { ProfileSection } from '@/components/worker/ProfileSection';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { WorkerSectionHeader } from '@/components/worker/WorkerCards';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { COMPACT_ROLE_TYPE_FILTER_OPTIONS, type RoleTypeFilter } from '@/lib/postingFilters';
import { computeListingMatchScore } from '@/lib/workerMatch';
import {
  getWorkerApplicationRoute,
  getWorkerShiftDetailRoute,
  WORKER_SETUP_AVAILABILITY_SCHEDULE,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function FillInsEmptyState({
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

export default function FillInsScreen() {
  const { user } = useAuth();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const province = workerProfile?.province ?? 'NS';
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [shiftRows, applicationRows] = await Promise.all([
        listLiveShiftPosts(province),
        user?.id ? listWorkerShiftApplications(user.id) : Promise.resolve([]),
      ]);
      setShifts(shiftRows);
      setApplications(applicationRows);
    } catch {
      setShifts([]);
      setApplications([]);
      Alert.alert('Could not load fill-ins', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [province, user?.id]);

  useRefreshOnFocus(load);

  const filteredShifts = useMemo(() => {
    if (roleTypeFilter === 'all') return shifts;
    return shifts.filter((shift) => shift.role_type === roleTypeFilter);
  }, [shifts, roleTypeFilter]);

  const activeApplications = applications.filter((item) =>
    ['applied', 'reviewed'].includes(item.status),
  );
  const confirmedApplications = applications.filter((item) => item.status === 'hired');

  const roleFilterOptions = COMPACT_ROLE_TYPE_FILTER_OPTIONS;

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.xl },
    group: { gap: spacing.md },
    list: { gap: spacing.md },
    applicationGroup: { gap: spacing.sm },
  }));

  return (
    <Screen title="Fill-ins" subtitle="Short-notice shifts, your schedule, and applications.">
      <View style={styles.content}>
        <ProfileSection
          title="Your availability"
          subtitle="Let clinics know when you can cover urgent shifts."
          actionLabel="Edit schedule"
          onActionPress={() => router.push(WORKER_SETUP_AVAILABILITY_SCHEDULE)}>
          <View style={styles.group}>
            <FillInModePanel />
            <AvailabilityScheduleSummary blocks={availabilityBlocks} />
          </View>
        </ProfileSection>

        <ProfileSection
          title="Open shifts"
          subtitle="Browse temp shifts you can apply to today.">
          <View style={styles.group}>
            <ChipSelector
              options={roleFilterOptions}
              selected={roleTypeFilter}
              onChange={(value) => setRoleTypeFilter(value as RoleTypeFilter)}
              horizontal
              compact
            />
            {filteredShifts.length === 0 && !isLoading ? (
              <FillInsEmptyState
                icon="calendar-outline"
                title="No open fill-ins"
                body="Check back soon — new short-notice shifts are posted throughout the week."
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
            )}
          </View>
        </ProfileSection>

        <ProfileSection
          title="Your fill-in shifts"
          subtitle="Shifts you have applied to or agreed to cover.">
          {activeApplications.length === 0 && confirmedApplications.length === 0 ? (
            <FillInsEmptyState
              icon="document-text-outline"
              title="No fill-in shifts yet"
              body="Apply to an open shift above and track it here."
            />
          ) : (
            <View style={styles.list}>
              {confirmedApplications.length > 0 ? (
                <View style={styles.applicationGroup}>
                  <WorkerSectionHeader title="Confirmed" />
                  {confirmedApplications.map((application) => (
                    <WorkerApplicationListCard
                      key={application.id}
                      application={application}
                      onPress={() => router.push(getWorkerApplicationRoute(application.id))}
                    />
                  ))}
                </View>
              ) : null}
              {activeApplications.length > 0 ? (
                <View style={styles.applicationGroup}>
                  <WorkerSectionHeader title="In progress" />
                  {activeApplications.map((application) => (
                    <WorkerApplicationListCard
                      key={application.id}
                      application={application}
                      onPress={() => router.push(getWorkerApplicationRoute(application.id))}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </ProfileSection>
      </View>
    </Screen>
  );
}
