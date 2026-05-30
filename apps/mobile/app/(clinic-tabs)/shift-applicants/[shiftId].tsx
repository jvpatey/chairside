import {
  getShiftPost,
  getUnreadConversationMap,
  listClinicApplicationsForShift,
  type ClinicApplication,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ClinicApplicationCard } from '@/components/clinic/ClinicApplicationCard';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { navigateAfterFillInSave, type FillInReturnTarget } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicShiftApplicationsScreen() {
  const { user } = useAuth();
  const { shiftId, returnTo } = useLocalSearchParams<{
    shiftId?: string;
    returnTo?: FillInReturnTarget;
  }>();
  const resolvedShiftId = typeof shiftId === 'string' ? shiftId : '';
  const resolvedReturnTo = typeof returnTo === 'string' ? returnTo : undefined;
  const [postTitle, setPostTitle] = useState('');
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: { gap: spacing.lg },
    list: { gap: spacing.md },
    empty: typography.subtitle,
  }));

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
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

  const subtitle = isLoading
    ? 'Loading…'
    : applications.length === 1
      ? '1 applicant'
      : `${applications.length} applicants`;

  return (
    <OnboardingShell>
      <AuthScreenHeader title={postTitle || 'Fill-in applicants'} subtitle={subtitle} onBack={goBack} />
      <View style={styles.content}>
        {applications.length === 0 && !isLoading ? (
          <Text style={styles.empty}>No cover requests for this fill-in yet.</Text>
        ) : (
          <View style={styles.list}>
            {applications.map((application) => (
              <ClinicApplicationCard
                key={application.id}
                application={application}
                returnTo="applications-tab"
                hasUnreadMessages={Boolean(unreadMap[application.id])}
                onUpdated={() => void load()}
              />
            ))}
          </View>
        )}
      </View>
    </OnboardingShell>
  );
}
