import {
  getClinicApplication,
  getUnreadConversationMap,
  type ClinicApplication,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { ClinicApplicationDetailCard } from '@/components/clinic/ClinicApplicationDetailCard';
import { InterviewScheduleSheet } from '@/components/clinic/InterviewScheduleSheet';
import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  navigateAfterClinicApplication,
  type ClinicApplicationReturnTarget,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

function formatClinicAddress(profile: {
  address_line1?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
} | null): string | null {
  if (!profile) return null;

  const parts = [
    profile.address_line1?.trim(),
    [profile.city?.trim(), profile.province?.trim()].filter(Boolean).join(', '),
    profile.postal_code?.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export default function ClinicApplicationDetailScreen() {
  const { user } = useAuth();
  const { clinicProfile } = useClinicProfile();
  const { markApplicationSeen } = useApplicationTabBadge();
  const { id, returnTo, roleJobId } = useLocalSearchParams<{
    id?: string;
    returnTo?: string;
    roleJobId?: string;
  }>();
  const applicationId = typeof id === 'string' ? id : '';
  const resolvedReturnTo =
    typeof returnTo === 'string' ? (returnTo as ClinicApplicationReturnTarget) : undefined;
  const resolvedRoleJobId = typeof roleJobId === 'string' ? roleJobId : undefined;

  const [application, setApplication] = useState<ClinicApplication | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<ClinicApplication | null>(null);
  const [scheduleMode, setScheduleMode] = useState<
    'offer' | 'edit_offer' | 'propose_reschedule'
  >('offer');
  const {
    celebrationVisible,
    celebrationPayload,
    showCelebration,
    closeCelebration,
  } = useHiringCelebration();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
  }));

  const goBack = useCallback(() => {
    navigateAfterClinicApplication(router, resolvedReturnTo, resolvedRoleJobId);
  }, [resolvedReturnTo, resolvedRoleJobId]);

  const load = useCallback(async () => {
    if (!user?.id || !applicationId) {
      setApplication(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [row, unreadMap] = await Promise.all([
        getClinicApplication(user.id, applicationId),
        getUnreadConversationMap(user.id, 'clinic'),
      ]);

      if (!row) {
        const message = 'This application may have been removed.';
        setFormError(message);
        if (Platform.OS !== 'web') {
          Alert.alert('Application not found', message);
        }
        goBack();
        return;
      }

      setApplication(row);
      setFormError(null);
      await markApplicationSeen(row.id);
      setHasUnreadMessages(Boolean(unreadMap[applicationId]));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not load application', message);
      }
      goBack();
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, goBack, markApplicationSeen, user?.id]);

  useRefreshOnFocus(load);

  const defaultLocation = formatClinicAddress(clinicProfile);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';

  return (
    <>
      <OnboardingShell>
        <AuthScreenHeader
          eyebrow="Application review"
          title={application?.post_title || 'Applicant'}
          onBack={goBack}
        />
        <View style={styles.content}>
          <FormErrorBanner message={formError} />
          {isLoading ? (
            <PageLoadingDetail />
          ) : application && user?.id ? (
            <ClinicApplicationDetailCard
              application={application}
              clinicId={user.id}
              returnTo={resolvedReturnTo}
              hasUnreadMessages={hasUnreadMessages}
              onUpdated={() => void load()}
              onScheduleInterview={(target, sheetMode = 'offer') => {
                setScheduleMode(sheetMode);
                setScheduleTarget(target);
              }}
              onHired={(hiredApplication) =>
                showCelebration({
                  applicationId: hiredApplication.id,
                  postType: hiredApplication.post_type,
                  audience: 'clinic',
                  counterpartName: hiredApplication.worker_display_name?.trim() || 'Applicant',
                  postTitle: hiredApplication.post_title,
                })
              }
              onConfirmed={(payload) => showCelebration(payload)}
              onRemoved={goBack}
              onDecided={goBack}
            />
          ) : null}
        </View>
      </OnboardingShell>

      {scheduleTarget ? (
        <InterviewScheduleSheet
          visible
          application={scheduleTarget}
          clinicName={clinicName}
          mode={scheduleMode}
          defaultLocation={defaultLocation}
          onSaved={() => {
            setScheduleTarget(null);
            void load();
          }}
          onClose={() => setScheduleTarget(null)}
        />
      ) : null}

      <HiringCelebrationModal
        visible={celebrationVisible}
        payload={celebrationPayload}
        onClose={() => void closeCelebration()}
      />
    </>
  );
}
