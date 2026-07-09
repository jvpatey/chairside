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
import { PlanUpgradeCallout } from '@/components/billing/PlanUpgradeCallout';
import { getClinicOutreachUpgradeMessage } from '@/components/billing/ClinicUpgradePrompt';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  CLINIC_SETUP_BASICS,
  getClinicConversationRoute,
  getClinicOutreachComposeRoute,
  navigateAfterFillInSave,
  type FillInReturnTarget,
} from '@/lib/routing';
import { hasActiveListSearch, matchesFillInOutreachWorkerSearch } from '@/lib/clinicListSearch';
import { useThemedStyles, type GradientAccent } from '@/theme';

const FILL_IN_ACCENT: GradientAccent = 'secondary';

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
  const { billing, upgradePrompt, showOutreachUpgrade } = useClinicUpgradePrompt();
  const { returnTo } = useLocalSearchParams<{ returnTo?: FillInReturnTarget }>();
  const resolvedReturnTo = returnTo ?? 'fill-ins-tab';

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
    lockedLabel: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelTertiary,
    },
    count: { ...typography.subtitle, fontSize: 13, color: colors.labelSecondary },
  }));

  const filteredRoleLabel = useMemo(() => {
    if (roleFilter === 'all') return 'all roles';
    return getRoleTypeLabel(roleFilter).toLowerCase();
  }, [roleFilter]);

  const filteredWorkers = useMemo(
    () => workers.filter((worker) => matchesFillInOutreachWorkerSearch(worker, searchQuery)),
    [searchQuery, workers],
  );

  const hasSearch = hasActiveListSearch(searchQuery);
  const isOutreachLocked = Boolean(billing && !billing.canUseFillInOutreach);

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

    if (isOutreachLocked) {
      setWorkers([]);
      setIsLoading(false);
      setFormError(null);
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
  }, [isOutreachLocked, isProfileComplete, roleFilter, user?.id]);

  useEffect(() => {
    void loadWorkers();
  }, [loadWorkers]);

  useRefreshOnFocus(loadWorkers);

  const handleBack = () => {
    navigateAfterFillInSave(router, resolvedReturnTo);
  };

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

    if (billing && !billing.canUseFillInOutreach) {
      showOutreachUpgrade();
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
    <>
      {upgradePrompt}
      <OnboardingShell>
      <View style={styles.form}>
        <AuthScreenHeader
          title="Find available workers"
          subtitle="Browse candidates who opted into fill-in outreach and message them directly. Phone numbers stay private."
          accent={FILL_IN_ACCENT}
          onBack={handleBack}
        />

        {isProfileComplete && isOutreachLocked ? (
          <PlanUpgradeCallout
            title="Upgrade to message workers"
            message={getClinicOutreachUpgradeMessage()}
            accent={FILL_IN_ACCENT}
          />
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.label, isOutreachLocked && styles.lockedLabel]}>
            Filter by role
          </Text>
          <ChipSelector
            options={ROLE_FILTER_OPTIONS}
            selected={roleFilter}
            onChange={(value) => setRoleFilter(value as RoleFilter)}
            accent={FILL_IN_ACCENT}
            disabled={isOutreachLocked}
          />
        </View>

        {isProfileComplete ? (
          <ListSearchFilterRow
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search worker name or city"
            accessibilityLabel="Search available workers"
            disabled={isOutreachLocked}
          />
        ) : null}

        {formError ? <FormErrorBanner message={formError} /> : null}

        {!isProfileComplete ? (
          <EmptyState
            icon="person-outline"
            title="Complete your profile"
            message="Finish your clinic profile to browse available workers."
            accent={FILL_IN_ACCENT}
          />
        ) : isOutreachLocked ? null : isLoading ? (
          <PageLoadingList rowCount={4} message="Loading available workers…" />
        ) : workers.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No workers available"
            message={`No workers are open to clinic outreach for ${filteredRoleLabel} in ${clinicProfile?.province ?? 'your province'} yet.`}
            accent={FILL_IN_ACCENT}
          />
        ) : filteredWorkers.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title={hasSearch ? 'No matches' : 'No workers available'}
            message={
              hasSearch
                ? 'No workers match your search.'
                : `No workers are open to clinic outreach for ${filteredRoleLabel} in ${clinicProfile?.province ?? 'your province'} yet.`
            }
            accent={FILL_IN_ACCENT}
          />
        ) : (
          <>
            <Text style={styles.count}>
              {filteredWorkers.length} worker{filteredWorkers.length === 1 ? '' : 's'} available
            </Text>
            <View style={styles.list}>
              <StaggeredList>
                {filteredWorkers.map((worker) => (
                  <AvailableFillInWorkerCard
                    key={worker.workerId}
                    worker={worker}
                    onMessage={() => handleMessage(worker)}
                  />
                ))}
              </StaggeredList>
            </View>
          </>
        )}
      </View>
    </OnboardingShell>
    </>
  );
}
