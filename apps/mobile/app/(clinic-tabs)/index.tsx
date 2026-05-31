import {
  getClinicDashboardCounts,
  getJobPostApplicationCountsMap,
  getMissingClinicProfileFields,
  listConversationsForClinic,
  listJobApplicationSummaries,
  listJobPosts,
  listShiftPosts,
  type ClinicDashboardCounts,
  listUpcomingConfirmedFillIns,
  type ConfirmedFillInSummary,
  type Conversation,
  type JobApplicationSummary,
  type JobPost,
  type ShiftPost,
} from '@chairside/api';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import {
  DashboardHero,
  DashboardOverviewPanel,
  QuickActionTile,
  SectionHeader,
  StatGrid,
  type OverviewStat,
} from '@/components/clinic/ClinicCards';
import { ClinicReadinessChecklist } from '@/components/clinic/ClinicReadinessChecklist';
import { DashboardCoverRequestsCard } from '@/components/clinic/DashboardCoverRequestsCard';
import { DashboardUnreadMessagesCard } from '@/components/messaging/DashboardUnreadMessagesCard';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useFillInPending } from '@/contexts/FillInPendingContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  CLINIC_FILL_INS,
  CLINIC_POST_JOB,
  CLINIC_SETUP_BASICS,
  getClinicApplicationMessagesRoute,
  getClinicMessagesRoute,
  getJobDetailRoute,
  getClinicRoleApplicationsRoute,
  getPostShiftRoute,
  getShiftDetailRoute,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicDashboardScreen() {
  const { user } = useAuth();
  const { refreshUnread } = useMessageUnread();
  const { pendingCount } = useFillInPending();
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { overview } = useLocalSearchParams<{ overview?: string }>();
  const [counts, setCounts] = useState<ClinicDashboardCounts>({
    openRoles: 0,
    fillInsPosted: 0,
    totalApplications: 0,
    newApplications: 0,
  });
  const [selectedOverview, setSelectedOverview] = useState<OverviewStat>('roles');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [shifts, setShifts] = useState<ShiftPost[]>([]);
  const [jobApplicationSummaries, setJobApplicationSummaries] = useState<JobApplicationSummary[]>(
    [],
  );
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [confirmedFillIns, setConfirmedFillIns] = useState<ConfirmedFillInSummary[]>([]);

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.xl,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  }));

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [nextCounts, jobPosts, shiftPosts, summaries, counts, conversationRows, confirmed] =
        await Promise.all([
        getClinicDashboardCounts(user.id),
        listJobPosts(user.id),
        listShiftPosts(user.id),
        listJobApplicationSummaries(user.id),
        getJobPostApplicationCountsMap(user.id),
        listConversationsForClinic(user.id),
        listUpcomingConfirmedFillIns(user.id),
      ]);

      setCounts(nextCounts);
      setJobs(jobPosts);
      setShifts(shiftPosts);
      setJobApplicationSummaries(summaries);
      setApplicantCounts(counts);
      setConversations(conversationRows);
      setConfirmedFillIns(confirmed);
      await refreshUnread();
    } catch {
      setCounts({ openRoles: 0, fillInsPosted: 0, totalApplications: 0, newApplications: 0 });
      setJobs([]);
      setShifts([]);
      setJobApplicationSummaries([]);
      setApplicantCounts({});
      setConversations([]);
      setConfirmedFillIns([]);
    }
  }, [refreshUnread, user?.id]);

  useRefreshOnFocus(loadDashboard);

  const handleJobUpdated = useCallback(
    (updated: JobPost) => {
      setJobs((prev) => prev.map((job) => (job.id === updated.id ? updated : job)));
      void loadDashboard();
    },
    [loadDashboard],
  );

  const handleJobDeleted = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
    setApplicantCounts((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (overview === 'roles' || overview === 'fill-ins' || overview === 'applications') {
      setSelectedOverview(overview);
    }
  }, [overview]);

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

  const clinicName = clinicProfile?.clinic_name?.trim() || null;
  const province = clinicProfile?.province ?? 'NS';

  return (
    <Screen showHeader={false} showNotifications={false}>
      <View style={styles.content}>
        <DashboardHero
          clinicName={clinicName}
          province={province}
          showLocationBadge={isProfileComplete}
        />

        <ClinicReadinessChecklist clinicProfile={clinicProfile} />

        <DashboardCoverRequestsCard
          pendingCount={pendingCount}
          onPress={() => router.push(CLINIC_FILL_INS)}
        />

        <DashboardUnreadMessagesCard
          conversations={conversations}
          avatarKind="worker"
          onConversationPress={(conversation) =>
            router.push(
              getClinicApplicationMessagesRoute(conversation.application_id, 'messages-tab', {
                conversationId: conversation.id,
                title: conversation.counterpart_name,
                subtitle: conversation.post_title,
              }),
            )
          }
          onViewAllPress={() => router.push(getClinicMessagesRoute())}
        />

        <View>
          <SectionHeader title="Quick actions" />
          <View style={styles.row}>
            <QuickActionTile
              label="Post a role"
              description="Full Time or Part Time"
              icon="briefcase-outline"
              onPress={() => guardPosting(CLINIC_POST_JOB)}
            />
            <QuickActionTile
              label="Post fill-in"
              description="Temp or urgent shift"
              icon="calendar-outline"
              variant="secondary"
              onPress={() => guardPosting(getPostShiftRoute('fill-ins-tab'))}
            />
          </View>
        </View>

        <View>
          <SectionHeader title="Overview" />
          <StatGrid
            openRoles={counts.openRoles}
            fillInsPosted={counts.fillInsPosted}
            totalApplications={counts.totalApplications}
            newApplications={counts.newApplications}
            selected={selectedOverview}
            onSelect={setSelectedOverview}
          />
        </View>

        <DashboardOverviewPanel
          selected={selectedOverview}
          jobs={jobs}
          shifts={shifts}
          confirmedFillIns={confirmedFillIns}
          jobApplicationSummaries={jobApplicationSummaries}
          applicantCounts={applicantCounts}
          clinicId={user?.id}
          onJobUpdated={handleJobUpdated}
          onJobDeleted={handleJobDeleted}
          onJobPress={(jobId) => router.push(getJobDetailRoute(jobId))}
          onShiftPress={(shiftId) => router.push(getShiftDetailRoute(shiftId, 'dashboard-fill-ins'))}
          onConfirmedFillInPress={(shiftId) =>
            router.push(getShiftDetailRoute(shiftId, 'dashboard-fill-ins'))
          }
          onJobApplicationsPress={(jobId) =>
            router.push(getClinicRoleApplicationsRoute(jobId, 'dashboard-applications'))
          }
        />
      </View>
    </Screen>
  );
}
