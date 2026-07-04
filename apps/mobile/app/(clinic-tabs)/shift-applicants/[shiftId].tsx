import {
  getShiftPost,
  getUnreadConversationMap,
  listClinicApplicationsForShift,
  type ClinicApplication,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { FillInApplicantCard } from '@/components/clinic/FillInApplicantCard';
import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { useAuth } from '@/contexts/AuthContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { hasActiveListSearch, matchesClinicApplicationSearch } from '@/lib/clinicListSearch';
import { navigateAfterFillInSave, type FillInReturnTarget } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicShiftApplicationsScreen() {
  const { user } = useAuth();
  const { shiftId, returnTo } = useLocalSearchParams<{
    shiftId?: string;
    returnTo?: FillInReturnTarget;
  }>();
  const resolvedShiftId = typeof shiftId === 'string' ? shiftId : '';
  const resolvedReturnTo = (typeof returnTo === 'string' ? returnTo : 'fill-ins-tab') as FillInReturnTarget;
  const [postTitle, setPostTitle] = useState('');
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const {
    celebrationVisible,
    celebrationPayload,
    showCelebration,
    closeCelebration,
  } = useHiringCelebration();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
    list: { gap: spacing.lg },
  }));

  const goBack = useCallback(() => {
    navigateAfterFillInSave(router, resolvedReturnTo);
  }, [resolvedReturnTo]);

  const load = useCallback(async () => {
    if (!user?.id || !resolvedShiftId) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [shift, rows, unread] = await Promise.all([
        getShiftPost(user.id, resolvedShiftId),
        listClinicApplicationsForShift(user.id, resolvedShiftId),
        getUnreadConversationMap(user.id, 'clinic'),
      ]);
      setPostTitle(shift ? `Fill-in · ${shift.shift_date}` : 'Fill-in applicants');
      setApplications(rows);
      setUnreadMap(unread);
    } catch (error) {
      setApplications([]);
      Alert.alert(
        'Could not load applicants',
        error instanceof Error ? error.message : 'Please try again.',
      );
      goBack();
    } finally {
      setIsLoading(false);
    }
  }, [goBack, resolvedShiftId, user?.id]);

  useRefreshOnFocus(load);

  const filteredApplications = useMemo(
    () => applications.filter((application) => matchesClinicApplicationSearch(application, searchQuery)),
    [applications, searchQuery],
  );

  const hasSearch = hasActiveListSearch(searchQuery);

  const subtitle = isLoading
    ? undefined
    : applications.length === 1
      ? '1 cover request'
      : `${applications.length} cover requests`;

  return (
    <>
      <OnboardingShell>
        <AuthScreenHeader title={postTitle || 'Fill-in applicants'} subtitle={subtitle} onBack={goBack} />
        <View style={styles.content}>
          {isLoading ? (
            <PageLoadingList message="Loading cover requests…" />
          ) : applications.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No cover requests yet"
              message="When workers request to cover this fill-in, they'll appear here."
              accent="secondary"
            />
          ) : (
            <View style={styles.list}>
              <ListSearchFilterRow
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search applicant name"
                accessibilityLabel="Search cover requests"
              />
              {filteredApplications.length === 0 ? (
                <EmptyState
                  icon="search-outline"
                  title="No matches"
                  message={
                    hasSearch
                      ? 'No cover requests match your search.'
                      : 'No cover requests for this fill-in yet.'
                  }
                  accent="secondary"
                />
              ) : (
                <StaggeredList>
                  {filteredApplications.map((application) => (
                    <FillInApplicantCard
                      key={application.id}
                      application={application}
                      clinicId={user?.id ?? ''}
                      returnTo={resolvedReturnTo}
                      hasUnreadMessages={Boolean(unreadMap[application.id])}
                      onUpdated={() => void load()}
                      onConfirmed={(payload) => showCelebration(payload)}
                    />
                  ))}
                </StaggeredList>
              )}
            </View>
          )}
        </View>
      </OnboardingShell>
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
