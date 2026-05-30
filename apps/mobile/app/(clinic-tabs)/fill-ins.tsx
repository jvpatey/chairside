import {
  getMissingClinicProfileFields,
  getShiftPostPendingApplicationCountsMap,
  getUnreadConversationMap,
  listFillInCoverRequests,
  listShiftPosts,
  listClinicApplications,
  type FillInCoverRequest,
  type ShiftPost,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { FillInApplicantCard } from '@/components/clinic/FillInApplicantCard';
import { FillInPostingCard } from '@/components/clinic/FillInPostingCard';
import { ShiftPostingFilters } from '@/components/clinic/PostingFilters';
import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useFillInPending } from '@/contexts/FillInPendingContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  filterShiftPosts,
  type RoleTypeFilter,
  type ShiftDateFilter,
  type ShiftStatusFilter,
} from '@/lib/postingFilters';
import {
  CLINIC_SETUP_BASICS,
  getPostShiftRoute,
  getShiftDetailRoute,
} from '@/lib/routing';
import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import { useTheme, useThemedStyles } from '@/theme';

function SectionHeader({ title }: { title: string }) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    header: { marginBottom: spacing.sm },
    title: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
    },
  }));

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function EmptyCard({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
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

function ConfirmedFillInRow({
  workerName,
  postTitle,
  meta,
}: {
  workerName: string;
  postTitle: string;
  meta: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1, gap: 2 },
    title: { ...typography.body, fontWeight: '600' },
    meta: typography.subtitle,
  }));

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{workerName} confirmed</Text>
        <Text style={styles.meta}>
          {postTitle} · {meta}
        </Text>
      </View>
    </View>
  );
}

export default function ClinicFillInsScreen() {
  const { user } = useAuth();
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { refreshPending } = useFillInPending();
  const [coverRequests, setCoverRequests] = useState<FillInCoverRequest[]>([]);
  const [shifts, setShifts] = useState<ShiftPost[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [confirmedRows, setConfirmedRows] = useState<
    { workerName: string; postTitle: string; meta: string }[]
  >([]);
  const [shiftStatusFilter, setShiftStatusFilter] = useState<ShiftStatusFilter>('open');
  const [shiftRoleTypeFilter, setShiftRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [shiftDateFilter, setShiftDateFilter] = useState<ShiftDateFilter>('all');
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const {
    celebrationVisible,
    celebrationPayload,
    showCelebration,
    closeCelebration,
  } = useHiringCelebration();

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: { gap: spacing.xl },
    list: { gap: spacing.md },
    section: { gap: spacing.sm },
  }));

  const filteredShifts = useMemo(
    () => filterShiftPosts(shifts, shiftStatusFilter, shiftRoleTypeFilter, shiftDateFilter),
    [shifts, shiftStatusFilter, shiftRoleTypeFilter, shiftDateFilter],
  );

  const load = useCallback(async () => {
    if (!user?.id) {
      setCoverRequests([]);
      setShifts([]);
      return;
    }

    try {
      const [requests, shiftPosts, counts, applications, unread] = await Promise.all([
        listFillInCoverRequests(user.id),
        listShiftPosts(user.id),
        getShiftPostPendingApplicationCountsMap(user.id),
        listClinicApplications(user.id),
        getUnreadConversationMap(user.id, 'clinic'),
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const confirmed = applications
        .filter(
          (application) =>
            application.post_type === 'shift' && application.status === 'hired',
        )
        .filter((application) => {
          const shift = shiftPosts.find((row) => row.id === application.shift_post_id);
          return shift ? shift.shift_date >= today : false;
        })
        .map((application) => {
          const shift = shiftPosts.find((row) => row.id === application.shift_post_id);
          return {
            workerName: application.worker_display_name?.trim() || 'Applicant',
            postTitle: application.post_title,
            meta: shift
              ? formatShiftPostMeta({
                  shift_date: shift.shift_date,
                  start_time: shift.start_time,
                  end_time: shift.end_time,
                })
              : application.post_title,
          };
        });

      setCoverRequests(requests);
      setShifts(shiftPosts);
      setPendingCounts(counts);
      setConfirmedRows(confirmed);
      setUnreadMap(unread);
      await refreshPending();
    } catch (error) {
      Alert.alert(
        'Could not load fill-ins',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, [refreshPending, user?.id]);

  useRefreshOnFocus(load);

  const guardPosting = (target: Href) => {
    if (isProfileComplete) {
      router.push(target);
      return;
    }

    const missing = getMissingClinicProfileFields(clinicProfile);
    Alert.alert(
      'Complete your clinic profile',
      missing.length > 0
        ? `Add the following before posting: ${missing.join(', ')}`
        : 'Finish your clinic profile to start posting.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue setup', onPress: () => router.push(CLINIC_SETUP_BASICS) },
      ],
    );
  };

  return (
    <>
      <Screen title="Fill-ins" subtitle="Review cover requests and manage your fill-in shifts.">
        <View style={styles.wrap}>
          <OnboardingButton
            label="Post fill-in"
            disabled={!isProfileComplete}
            onPress={() => guardPosting(getPostShiftRoute('fill-ins-tab'))}
          />

          <View style={styles.section}>
            <SectionHeader title="Needs response" />
            {coverRequests.length === 0 ? (
              <EmptyCard
                icon="checkmark-circle-outline"
                title="No pending cover requests"
                body="New requests from workers will appear here when they apply to cover a fill-in."
              />
            ) : (
              <View style={styles.list}>
                {coverRequests.map((request) => (
                  <FillInApplicantCard
                    key={request.id}
                    application={request}
                    clinicId={user?.id ?? ''}
                    returnTo="fill-ins-tab"
                    hasUnreadMessages={Boolean(unreadMap[request.id])}
                    onUpdated={() => void load()}
                    onConfirmed={(payload) => showCelebration(payload)}
                  />
                ))}
              </View>
            )}
          </View>

          {confirmedRows.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Upcoming confirmed" />
              <View style={styles.list}>
                {confirmedRows.map((row, index) => (
                  <ConfirmedFillInRow
                    key={`${row.workerName}-${index}`}
                    workerName={row.workerName}
                    postTitle={row.postTitle}
                    meta={row.meta}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader title="Your fill-ins" />
            {shifts.length > 0 ? (
              <ShiftPostingFilters
                statusFilter={shiftStatusFilter}
                roleTypeFilter={shiftRoleTypeFilter}
                shiftDateFilter={shiftDateFilter}
                onStatusChange={setShiftStatusFilter}
                onRoleTypeChange={setShiftRoleTypeFilter}
                onShiftDateChange={setShiftDateFilter}
              />
            ) : null}
            {shifts.length === 0 ? (
              <EmptyCard
                icon="calendar-outline"
                title="No fill-ins yet"
                body="Post a fill-in shift when you need temporary or urgent coverage."
              />
            ) : filteredShifts.length === 0 ? (
              <EmptyCard
                icon="filter-outline"
                title="No fill-ins in this filter"
                body="Try a different filter or post a new fill-in shift."
              />
            ) : (
              <View style={styles.list}>
                {filteredShifts.map((shift) => (
                  <FillInPostingCard
                    key={shift.id}
                    shift={shift}
                    pendingRequestCount={pendingCounts[shift.id] ?? 0}
                    onPress={() => router.push(getShiftDetailRoute(shift.id, 'fill-ins-tab'))}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </Screen>
      <HiringCelebrationModal
        visible={celebrationVisible}
        payload={celebrationPayload}
        onClose={() => {
          void closeCelebration();
          void load();
        }}
      />
    </>
  );
}
