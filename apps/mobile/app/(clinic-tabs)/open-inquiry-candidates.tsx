import {
  getErrorMessage,
  getOrCreateGeneralConversationAsClinic,
  listOpenInquiryWorkersForClinic,
  type OpenInquiryWorker,
  type RoleType,
} from '@chairside/api';
import { getRoleTypeLabel, ROLE_TYPE_OPTIONS } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { OpenInquiryCandidateCard } from '@/components/clinic/OpenInquiryCandidateCard';
import { ChipSelector } from '@/components/clinic/ChipSelector';
import { PlanUpgradeCallout } from '@/components/billing/PlanUpgradeCallout';
import { getClinicGeneralMessagingUpgradeMessage } from '@/components/billing/ClinicUpgradePrompt';
import { FormScreen } from '@/components/ui/FormScreen';
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
  getClinicMessagesRoute,
} from '@/lib/routing';
import { hasActiveListSearch, matchesOpenInquiryWorkerSearch } from '@/lib/clinicListSearch';
import { useThemedStyles, type GradientAccent } from '@/theme';

const ACCENT: GradientAccent = 'primary';

type RoleFilter = 'all' | RoleType;

const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All roles' },
  ...ROLE_TYPE_OPTIONS.map((option) => ({
    value: option.value as RoleFilter,
    label: option.label,
  })),
];

export default function OpenInquiryCandidatesScreen() {
  const { user } = useAuth();
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { billing, upgradePrompt, showGeneralMessagingUpgrade, handleBillingError } =
    useClinicUpgradePrompt();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [workers, setWorkers] = useState<OpenInquiryWorker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    section: { gap: spacing.sm },
    label: { ...typography.body, fontWeight: '600' },
    list: { gap: spacing.md },
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
    () => workers.filter((worker) => matchesOpenInquiryWorkerSearch(worker, searchQuery)),
    [searchQuery, workers],
  );

  const hasSearch = hasActiveListSearch(searchQuery);
  const isLocked = Boolean(billing && !billing.canUseGeneralCandidateMessaging);

  const loadWorkers = useCallback(async () => {
    if (!user?.id) {
      setWorkers([]);
      setIsLoading(false);
      return;
    }

    if (!isProfileComplete || isLocked) {
      setWorkers([]);
      setIsLoading(false);
      setFormError(null);
      return;
    }

    setIsLoading(true);
    setFormError(null);
    try {
      const rows = await listOpenInquiryWorkersForClinic({
        roleType: roleFilter === 'all' ? null : roleFilter,
      });
      setWorkers(rows);
    } catch (error) {
      if (handleBillingError(error)) {
        setWorkers([]);
        return;
      }
      setFormError(getErrorMessage(error, 'Could not load candidates.'));
      setWorkers([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleBillingError, isLocked, isProfileComplete, roleFilter, user?.id]);

  useEffect(() => {
    void loadWorkers();
  }, [loadWorkers]);

  useRefreshOnFocus(loadWorkers);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(getClinicMessagesRoute());
  };

  const guardProfile = () => {
    Alert.alert(
      'Complete your clinic profile',
      'Finish your clinic profile before messaging candidates.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue setup', onPress: () => router.push(CLINIC_SETUP_BASICS) },
      ],
    );
  };

  const handleMessage = async (worker: OpenInquiryWorker) => {
    if (!isProfileComplete) {
      guardProfile();
      return;
    }

    if (billing && !billing.canUseGeneralCandidateMessaging) {
      showGeneralMessagingUpgrade();
      return;
    }

    if (worker.existingConversationId) {
      router.push(getClinicConversationRoute(worker.existingConversationId));
      return;
    }

    if (isStarting) return;
    setIsStarting(true);
    try {
      const conversationId = await getOrCreateGeneralConversationAsClinic(worker.workerId);
      router.push(
        getClinicConversationRoute(conversationId, {
          conversationId,
          title: worker.displayName,
          subtitle: 'Open inquiry',
        }),
      );
    } catch (error) {
      if (handleBillingError(error)) return;
      Alert.alert(
        'Could not start conversation',
        getErrorMessage(error, 'Please try again.'),
      );
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <>
      {upgradePrompt}
      <FormScreen
        title="Open inquiries"
        subtitle="Browse candidates who opted in to messages about opportunities. Phone numbers stay private."
        accent={ACCENT}
        onBack={handleBack}
      >
        {isProfileComplete && isLocked ? (
          <PlanUpgradeCallout
            title="Upgrade for open inquiries"
            message={getClinicGeneralMessagingUpgradeMessage(billing?.planFamily ?? 'clinic')}
            accent={ACCENT}
          />
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.label, isLocked && styles.lockedLabel]}>Filter by role</Text>
          <ChipSelector
            options={ROLE_FILTER_OPTIONS}
            selected={roleFilter}
            onChange={(value) => setRoleFilter(value as RoleFilter)}
            accent={ACCENT}
            disabled={isLocked}
          />
        </View>

        {isProfileComplete ? (
          <ListSearchFilterRow
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search candidate name or city"
            accessibilityLabel="Search open inquiry candidates"
            disabled={isLocked}
          />
        ) : null}

        {formError ? <FormErrorBanner message={formError} /> : null}

        {!isProfileComplete ? (
          <EmptyState
            icon="person-outline"
            title="Complete your profile"
            message="Finish your clinic profile to browse candidates."
            accent={ACCENT}
          />
        ) : isLocked ? null : isLoading ? (
          <PageLoadingList rowCount={4} message="Loading candidates…" />
        ) : workers.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No candidates yet"
            message={`No workers have opted into open inquiries for ${filteredRoleLabel} in ${clinicProfile?.province ?? 'your province'} yet.`}
            accent={ACCENT}
          />
        ) : filteredWorkers.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title={hasSearch ? 'No matches' : 'No candidates yet'}
            message={
              hasSearch
                ? 'No candidates match your search.'
                : `No workers have opted into open inquiries for ${filteredRoleLabel} in ${clinicProfile?.province ?? 'your province'} yet.`
            }
            accent={ACCENT}
          />
        ) : (
          <>
            <Text style={styles.count}>
              {filteredWorkers.length} candidate{filteredWorkers.length === 1 ? '' : 's'}
            </Text>
            <View style={styles.list}>
              <StaggeredList>
                {filteredWorkers.map((worker) => (
                  <OpenInquiryCandidateCard
                    key={worker.workerId}
                    worker={worker}
                    onMessage={() => {
                      void handleMessage(worker);
                    }}
                  />
                ))}
              </StaggeredList>
            </View>
          </>
        )}
      </FormScreen>
    </>
  );
}
