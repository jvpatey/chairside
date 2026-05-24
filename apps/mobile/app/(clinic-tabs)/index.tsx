import {
  getClinicDashboardCounts,
  getJobPostApplicationCountsMap,
  getMissingClinicProfileFields,
  listJobApplicationSummaries,
  listJobPosts,
  listShiftPosts,
  type ClinicDashboardCounts,
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
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  CLINIC_POST_JOB,
  CLINIC_SETUP_BASICS,
  getJobDetailRoute,
  getClinicRoleApplicationsRoute,
  getPostShiftRoute,
  getShiftDetailRoute,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicDashboardScreen() {
  const { user } = useAuth();
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { overview } = useLocalSearchParams<{ overview?: string }>();
  const [counts, setCounts] = useState<ClinicDashboardCounts>({
    openRoles: 0,
    fillInsPosted: 0,
    newApplications: 0,
  });
  const [selectedOverview, setSelectedOverview] = useState<OverviewStat>('roles');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [shifts, setShifts] = useState<ShiftPost[]>([]);
  const [jobApplicationSummaries, setJobApplicationSummaries] = useState<JobApplicationSummary[]>(
    [],
  );
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});

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
      const [nextCounts, jobPosts, shiftPosts, summaries, counts] = await Promise.all([
        getClinicDashboardCounts(user.id),
        listJobPosts(user.id),
        listShiftPosts(user.id),
        listJobApplicationSummaries(user.id),
        getJobPostApplicationCountsMap(user.id),
      ]);

      setCounts(nextCounts);
      setJobs(jobPosts);
      setShifts(shiftPosts);
      setJobApplicationSummaries(summaries);
      setApplicantCounts(counts);
    } catch {
      setCounts({ openRoles: 0, fillInsPosted: 0, newApplications: 0 });
      setJobs([]);
      setShifts([]);
      setJobApplicationSummaries([]);
      setApplicantCounts({});
    }
  }, [user?.id]);

  useRefreshOnFocus(loadDashboard);

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
              onPress={() => guardPosting(getPostShiftRoute('dashboard-fill-ins'))}
            />
          </View>
        </View>

        <View>
          <SectionHeader title="Overview" />
          <StatGrid
            openRoles={counts.openRoles}
            fillInsPosted={counts.fillInsPosted}
            newApplications={counts.newApplications}
            selected={selectedOverview}
            onSelect={setSelectedOverview}
          />
        </View>

        <DashboardOverviewPanel
          selected={selectedOverview}
          jobs={jobs}
          shifts={shifts}
          jobApplicationSummaries={jobApplicationSummaries}
          applicantCounts={applicantCounts}
          onJobPress={(jobId) => router.push(getJobDetailRoute(jobId))}
          onShiftPress={(shiftId) =>
            router.push(getShiftDetailRoute(shiftId, 'dashboard-fill-ins'))
          }
          onJobApplicationsPress={(jobId) =>
            router.push(getClinicRoleApplicationsRoute(jobId))
          }
        />
      </View>
    </Screen>
  );
}
