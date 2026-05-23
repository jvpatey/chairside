import { getClinicDashboardCounts, getMissingClinicProfileFields, type ClinicDashboardCounts } from '@chairside/api';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import {
  ActivityEmptyState,
  DashboardHero,
  QuickActionTile,
  SectionHeader,
  SetupBanner,
  StatGrid,
} from '@/components/clinic/ClinicCards';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  CLINIC_APPLICATIONS,
  CLINIC_POST_JOB,
  CLINIC_POST_SHIFT,
  CLINIC_POSTINGS,
  CLINIC_SETUP_BASICS,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicDashboardScreen() {
  const { user } = useAuth();
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const [counts, setCounts] = useState<ClinicDashboardCounts>({
    openRoles: 0,
    fillInsPosted: 0,
    newApplications: 0,
  });

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.xl,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  }));

  const loadCounts = useCallback(async () => {
    if (!user?.id) return;
    try {
      const nextCounts = await getClinicDashboardCounts(user.id);
      setCounts(nextCounts);
    } catch {
      setCounts({ openRoles: 0, fillInsPosted: 0, newApplications: 0 });
    }
  }, [user?.id]);

  useRefreshOnFocus(loadCounts);

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

  return (
    <Screen showHeader={false}>
      <View style={styles.content}>
        <DashboardHero clinicName={clinicName} />

        {!isProfileComplete ? (
          <SetupBanner onPress={() => router.push(CLINIC_SETUP_BASICS)} />
        ) : null}

        <View>
          <SectionHeader title="Quick actions" />
          <View style={styles.row}>
            <QuickActionTile
              label="Post a role"
              description="Permanent or part-time"
              icon="briefcase-outline"
              onPress={() => guardPosting(CLINIC_POST_JOB)}
            />
            <QuickActionTile
              label="Post fill-in"
              description="Temp or urgent shift"
              icon="calendar-outline"
              variant="secondary"
              onPress={() => guardPosting(CLINIC_POST_SHIFT)}
            />
          </View>
        </View>

        <View>
          <SectionHeader title="Overview" />
          <StatGrid
            openRoles={counts.openRoles}
            fillInsPosted={counts.fillInsPosted}
            newApplications={counts.newApplications}
            onOpenRolesPress={() => router.push(CLINIC_POSTINGS)}
            onFillInsPress={() => router.push(CLINIC_POSTINGS)}
            onApplicationsPress={() => router.push(CLINIC_APPLICATIONS)}
          />
        </View>

        <View>
          <SectionHeader title="Recent activity" />
          <ActivityEmptyState hasApplications={counts.newApplications > 0} />
        </View>
      </View>
    </Screen>
  );
}
