import {
  listLiveShiftPosts,
  listWorkerShiftApplications,
  type LiveShiftPost,
  type WorkerApplication,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AvailabilityScheduleSummary } from '@/components/worker/AvailabilityScheduleSummary';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { COMPACT_ROLE_TYPE_FILTER_OPTIONS, type RoleTypeFilter } from '@/lib/postingFilters';
import { computeListingMatchScore } from '@/lib/workerMatch';
import { getWorkerShiftDetailRoute, WORKER_SETUP_AVAILABILITY_SCHEDULE } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function ShiftApplicationCard({ application }: { application: WorkerApplication }) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.xs,
    },
    title: { ...typography.body, fontWeight: '600' },
    meta: typography.subtitle,
    status: { fontSize: 14, fontWeight: '600', color: colors.primary },
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{application.post_title}</Text>
      <Text style={styles.meta}>
        {application.clinic_name}
        {application.clinic_city ? ` · ${application.clinic_city}` : ''}
      </Text>
      <Text style={styles.status}>{application.status}</Text>
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    wrap: { gap: spacing.xs, marginBottom: spacing.sm },
    title: { ...typography.body, fontWeight: '700', fontSize: 16 },
    subtitle: typography.subtitle,
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
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
  const { colors } = useTheme();

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
    ['applied', 'reviewed', 'shortlisted'].includes(item.status),
  );
  const confirmedApplications = applications.filter((item) => item.status === 'hired');

  const roleFilterOptions = COMPACT_ROLE_TYPE_FILTER_OPTIONS;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    content: { gap: spacing.xl, paddingBottom: spacing.xl },
    section: { gap: spacing.md },
    list: { gap: spacing.md },
    editSchedule: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    editScheduleText: { fontSize: 15, fontWeight: '600', color: colors.primary },
    empty: { color: colors.labelSecondary, fontSize: 14, lineHeight: 20 },
    subsection: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
  }));

  return (
    <Screen title="Fill-ins" subtitle="Temp shifts, availability, and your fill-in applications.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <FillInModePanel />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Weekly schedule"
            subtitle="When you are generally available for fill-in shifts."
          />
          <AvailabilityScheduleSummary blocks={availabilityBlocks} />
          <Pressable
            style={styles.editSchedule}
            onPress={() => router.push(WORKER_SETUP_AVAILABILITY_SCHEDULE)}>
            <Text style={styles.editScheduleText}>Edit schedule</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Available fill-ins"
            subtitle="Open shift postings you can apply to today."
          />
          <ChipSelector
            options={roleFilterOptions}
            selected={roleTypeFilter}
            onChange={(value) => setRoleTypeFilter(value as RoleTypeFilter)}
            horizontal
            compact
          />
          {filteredShifts.length === 0 && !isLoading ? (
            <Text style={styles.empty}>No fill-in shifts posted in your province right now.</Text>
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

        <View style={styles.section}>
          <SectionHeader
            title="My fill-ins"
            subtitle="Shifts you have applied to or agreed to work."
          />
          {activeApplications.length === 0 && confirmedApplications.length === 0 ? (
            <Text style={styles.empty}>No fill-in applications yet.</Text>
          ) : (
            <View style={styles.list}>
              {confirmedApplications.length > 0 ? (
                <>
                  <Text style={styles.subsection}>Confirmed</Text>
                  {confirmedApplications.map((application) => (
                    <ShiftApplicationCard key={application.id} application={application} />
                  ))}
                </>
              ) : null}
              {activeApplications.length > 0 ? (
                <>
                  <Text style={styles.subsection}>Active</Text>
                  {activeApplications.map((application) => (
                    <ShiftApplicationCard key={application.id} application={application} />
                  ))}
                </>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
