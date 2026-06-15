import {
  listFillInOutreachWorkersForClinic,
  type FillInOutreachWorker,
  type RoleType,
} from '@chairside/api';
import { getRoleTypeLabel, ROLE_TYPE_OPTIONS } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AvailableFillInWorkerCard } from '@/components/clinic/AvailableFillInWorkerCard';
import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  CLINIC_SETUP_BASICS,
  getClinicConversationRoute,
  getClinicOutreachComposeRoute,
  type FillInReturnTarget,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

type RoleFilter = 'all' | RoleType;

const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All roles' },
  ...ROLE_TYPE_OPTIONS.map((option) => ({
    value: option.value as RoleFilter,
    label: option.label,
  })),
];

export default function FindAvailableWorkersScreen() {
  const { user } = useAuth();
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { returnTo } = useLocalSearchParams<{ returnTo?: FillInReturnTarget }>();
  const resolvedReturnTo = returnTo ?? 'fill-ins-tab';

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [workers, setWorkers] = useState<FillInOutreachWorker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    form: { gap: spacing.lg },
    section: { gap: spacing.sm },
    label: { ...typography.body, fontWeight: '600' },
    list: { gap: spacing.md },
    empty: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.labelSecondary,
      paddingVertical: spacing.lg,
    },
    notice: {
      backgroundColor: colors.primarySubtle,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    noticeTitle: { ...typography.body, fontWeight: '600' },
    noticeBody: { ...typography.subtitle, fontSize: 14, lineHeight: 20 },
    count: { ...typography.subtitle, fontSize: 13, color: colors.labelSecondary },
  }));

  const filteredRoleLabel = useMemo(() => {
    if (roleFilter === 'all') return 'all roles';
    return getRoleTypeLabel(roleFilter).toLowerCase();
  }, [roleFilter]);

  const loadWorkers = useCallback(async () => {
    if (!user?.id) {
      setWorkers([]);
      setIsLoading(false);
      return;
    }

    if (!isProfileComplete) {
      setWorkers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFormError(null);
    try {
      const rows = await listFillInOutreachWorkersForClinic({
        roleType: roleFilter === 'all' ? null : roleFilter,
      });
      setWorkers(rows);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not load workers.');
      setWorkers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isProfileComplete, roleFilter, user?.id]);

  useEffect(() => {
    void loadWorkers();
  }, [loadWorkers]);

  useRefreshOnFocus(loadWorkers);

  const guardProfile = () => {
    Alert.alert(
      'Complete your clinic profile',
      'Finish your clinic profile before messaging available workers.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue setup', onPress: () => router.push(CLINIC_SETUP_BASICS) },
      ],
    );
  };

  const handleMessage = (worker: FillInOutreachWorker) => {
    if (!isProfileComplete) {
      guardProfile();
      return;
    }

    if (worker.existingConversationId) {
      router.push(getClinicConversationRoute(worker.existingConversationId));
      return;
    }

    router.push(
      getClinicOutreachComposeRoute({
        workerId: worker.workerId,
        workerName: worker.displayName,
        roleType: roleFilter === 'all' ? worker.roleTypes[0] ?? 'hygienist' : roleFilter,
        smsOptIn: worker.smsOptIn,
        returnTo: resolvedReturnTo,
      }),
    );
  };

  return (
    <OnboardingShell>
      <View style={styles.form}>
        <AuthScreenHeader
          title="Find available workers"
          subtitle="Browse candidates who opted into fill-in outreach and message them directly."
          onBack={() => router.back()}
        />

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Direct outreach</Text>
          <Text style={styles.noticeBody}>
            Workers appear here when they are available for fill-ins and allow clinics to reach
            out. Phone numbers stay private.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Filter by role</Text>
          <ChipSelector
            options={ROLE_FILTER_OPTIONS}
            selected={roleFilter}
            onChange={(value) => setRoleFilter(value as RoleFilter)}
          />
        </View>

        {formError ? <FormErrorBanner message={formError} /> : null}

        {!isProfileComplete ? (
          <Text style={styles.empty}>Complete your clinic profile to browse available workers.</Text>
        ) : isLoading ? (
          <PageLoadingDetail />
        ) : workers.length === 0 ? (
          <Text style={styles.empty}>
            No workers are open to clinic outreach for {filteredRoleLabel} in{' '}
            {clinicProfile?.province ?? 'your province'} yet.
          </Text>
        ) : (
          <>
            <Text style={styles.count}>
              {workers.length} worker{workers.length === 1 ? '' : 's'} available
            </Text>
            <View style={styles.list}>
              {workers.map((worker) => (
                <AvailableFillInWorkerCard
                  key={worker.workerId}
                  worker={worker}
                  onMessage={() => handleMessage(worker)}
                />
              ))}
            </View>
          </>
        )}
      </View>
    </OnboardingShell>
  );
}
