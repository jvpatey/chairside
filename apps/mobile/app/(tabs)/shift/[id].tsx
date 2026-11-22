import {
  createApplication,
  getErrorMessage,
  getLiveShiftPost,
  getMissingWorkerProfileFields,
  getWorkerShiftApplication,
  isShiftPostSaved,
  isSourcedListing,
  recordShiftPostListingView,
  saveShiftPost,
  unsaveShiftPost,
  ACTIVE_SHIFT_COVER_STATUSES,
  type LiveShiftPost,
  type WorkerApplication,
} from '@chairside/api';
import { getSpecialtyLabel } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import {
  CancelledPillBadge,
  RequestedPillBadge,
} from '@/components/matching/ApplicationStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CardDetailSection } from '@/components/ui/CardDetailSection';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { ClinicProfileLinkFooter } from '@/components/worker/ClinicProfileLinkFooter';
import { SavePostButton } from '@/components/worker/SavePostButton';
import { ShiftUrgencyBadge } from '@/components/worker/ShiftUrgencyBadge';
import {
  hasSourcedContactChannels,
  SourcedListingContactActions,
} from '@/components/worker/SourcedListingContactActions';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { AnalyticsEvents } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
import {
  getWorkerApplicationRoute,
  getWorkerClinicProfileRoute,
  getWorkerClinicProfileBackLabel,
  navigateAfterWorkerShift,
  parseWorkerPostingReturnParams,
  WORKER_PENDING_FILLINS,
  WORKER_SETUP_BASICS,
  type WorkerApplicationReturnTarget,
} from '@/lib/routing';
import { resolvePostingAttributionLabels } from '@/hooks/useClinicActingContext';
import {
  formatWorkerPostLocation,
  resolveWorkerPostLocationParts,
  resolveWorkerPostLogoStoragePath,
} from '@/lib/workerPostLocation';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { useThemedStyles } from '@/theme';

type ShiftApplicationView =
  | { kind: 'none' }
  | { kind: 'pending' }
  | { kind: 'confirmed' }
  | { kind: 'cancelled'; application: WorkerApplication };

function resolveShiftApplicationView(application: WorkerApplication | null): ShiftApplicationView {
  if (!application) return { kind: 'none' };

  if (application.status === 'hired') {
    return { kind: 'confirmed' };
  }

  if (application.status === 'rejected' && application.status_closed_by) {
    return { kind: 'cancelled', application };
  }

  if (ACTIVE_SHIFT_COVER_STATUSES.includes(application.status)) {
    return { kind: 'pending' };
  }

  return { kind: 'none' };
}

export default function WorkerShiftDetailScreen() {
  const { user } = useAuth();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { id, returnTo, applicationId, applicationReturnTo: postingApplicationReturnTo } =
    useLocalSearchParams<{
    id?: string;
    returnTo?: string;
    applicationId?: string;
    applicationReturnTo?: string;
  }>();
  const shiftId = typeof id === 'string' ? id : '';
  const returnContext = useMemo(
    () =>
      parseWorkerPostingReturnParams({
        returnTo,
        applicationId,
        applicationReturnTo: postingApplicationReturnTo,
      }),
    [applicationId, postingApplicationReturnTo, returnTo],
  );
  const resolvedReturnTo = typeof returnTo === 'string' ? returnTo : undefined;
  const backLabel = getWorkerClinicProfileBackLabel(returnContext);

  const goBack = useCallback(() => {
    if (returnContext?.returnTo === 'application-detail') {
      navigateAfterWorkerShift(router, returnContext.returnTo, returnContext);
      return;
    }
    navigateAfterWorkerShift(router, resolvedReturnTo);
  }, [resolvedReturnTo, returnContext]);
  const [shift, setShift] = useState<LiveShiftPost | null>(null);
  const [shiftApplication, setShiftApplication] = useState<WorkerApplication | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
  }));

  const loadShift = useCallback(async () => {
    if (!shiftId) {
      setShift(null);
      setShiftApplication(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextShift = await getLiveShiftPost(shiftId);
      if (!nextShift) {
        Alert.alert('Shift not found', 'This fill-in may no longer be available.');
        goBack();
        return;
      }
      setShift(nextShift);

      if (user?.id) {
        void recordShiftPostListingView(shiftId).catch(() => {
          // Reach tracking is best-effort — never block the detail screen.
        });
        const [application, saved] = await Promise.all([
          getWorkerShiftApplication(user.id, shiftId),
          isShiftPostSaved(user.id, shiftId),
        ]);
        setShiftApplication(application);
        setIsSaved(saved);
      } else {
        setShiftApplication(null);
      }
    } catch (error) {
      Alert.alert(
        'Could not load fill-in',
        error instanceof Error ? error.message : 'Please try again.',
      );
      goBack();
    } finally {
      setIsLoading(false);
    }
  }, [goBack, shiftId, user?.id]);

  useRefreshOnFocus(loadShift);

  const handleToggleSaved = useCallback(async () => {
    if (!user?.id || !shift) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      if (nextSaved) await saveShiftPost(shift.id);
      else await unsaveShiftPost(shift.id);
    } catch (error) {
      setIsSaved(!nextSaved);
      Alert.alert(
        'Could not update saved fill-in',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, [isSaved, shift, user?.id]);

  const handleRequestCover = useCallback(() => {
    if (!shift) return;

    if (!isProfileComplete) {
      const missing = getMissingWorkerProfileFields(workerProfile);
      showConfirmActionSheet({
        title: 'Complete your profile',
        message:
          missing.length > 0
            ? `Add the following before requesting cover: ${missing.join(', ')}`
            : 'Finish your profile to request cover.',
        confirmLabel: 'Continue setup',
        onConfirm: () => router.push(WORKER_SETUP_BASICS),
      });
      return;
    }

    if (!user?.id) return;

    showConfirmActionSheet({
      title: 'Request to cover?',
      message: 'We’ll notify the clinic. You’ll get a text if they confirm you.',
      confirmLabel: 'Request cover',
      onConfirm: () => {
        void (async () => {
          setIsRequesting(true);
          try {
            await createApplication(user.id, { shiftPostId: shift.id });
            captureAnalyticsEvent(AnalyticsEvents.coverRequested, {
              target: 'shift',
              listing_id: shift.id,
            });
            router.replace(WORKER_PENDING_FILLINS);
          } catch (error) {
            Alert.alert('Request failed', getErrorMessage(error, 'Please try again.'));
          } finally {
            setIsRequesting(false);
          }
        })();
      },
    });
  }, [isProfileComplete, shift, user?.id, workerProfile]);

  if (isLoading || !shift) {
    return (
      <FormScreen
        title="Fill-in details"
        subtitle={isLoading ? undefined : 'Fill-in not found.'}
        backLabel={backLabel}
        onBack={goBack}>
        {isLoading ? <PageLoadingDetail /> : null}
      </FormScreen>
    );
  }

  const applicationView = resolveShiftApplicationView(shiftApplication);
  const applicationReturnTo: WorkerApplicationReturnTarget =
    returnContext?.returnTo === 'application-detail'
      ? (returnContext.applicationReturnTo ?? 'applications-tab')
      : ((resolvedReturnTo as WorkerApplicationReturnTarget | undefined) ?? 'fill-ins-tab');

  const sourced = isSourcedListing(shift);

  const footerAction = sourced ? (
    <SourcedListingContactActions contact={shift} sections="buttons" />
  ) : applicationView.kind === 'none' ? (
    <OnboardingButton
      label={isRequesting ? 'Requesting…' : 'Request to cover'}
      disabled={isRequesting}
      onPress={handleRequestCover}
    />
  ) : applicationView.kind === 'pending' ? (
    <OnboardingButton label="Requested — waiting on clinic" disabled />
  ) : applicationView.kind === 'confirmed' && shiftApplication ? (
    <OnboardingButton
      label="View confirmed fill-in"
      onPress={() =>
        router.push(getWorkerApplicationRoute(shiftApplication.id, applicationReturnTo))
      }
    />
  ) : applicationView.kind === 'cancelled' && shiftApplication ? (
    <OnboardingButton
      label={isRequesting ? 'Requesting…' : 'Request to cover again'}
      disabled={isRequesting}
      onPress={handleRequestCover}
    />
  ) : null;

  const statusFooter =
    applicationView.kind === 'pending' ? (
      <RequestedPillBadge />
    ) : applicationView.kind === 'cancelled' ? (
      <CancelledPillBadge />
    ) : null;

  const location = formatWorkerPostLocation(shift);
  const { displayName, placeLabel } = resolveWorkerPostLocationParts(shift);
  const { postedByLabel, postedOnLabel } = resolvePostingAttributionLabels({
    postedAt: shift.created_at,
    postedByDisplayName: shift.posted_by_display_name,
    postedByTitle: shift.posted_by_title,
  });

  return (
    <FormScreen
      title="Fill-in details"
      subtitle={shift.clinic.clinic_name}
      backLabel={backLabel}
      onBack={goBack}
      headerAccessory={
        user?.id ? <SavePostButton isSaved={isSaved} onToggle={() => void handleToggleSaved()} /> : null
      }
      accent="primary"
      footer={footerAction}>
      <View style={styles.content}>
        <ShiftPostDetailView
          shift={shift}
          softwareUsed={shift.clinic.software_used}
          section="hero"
          featured={shift.has_priority_listing}
          heroAccessory={<ShiftUrgencyBadge urgency={shift.urgency} />}
        />
        {sourced ? (
          <SurfaceCard>
            <ClinicPostHeader
              clinicName={displayName}
              logoStoragePath={resolveWorkerPostLogoStoragePath(shift)}
              location={placeLabel}
              detail={getSpecialtyLabel(shift.clinic.specialty)}
              detailIcon="medkit-outline"
              metaIcons
            />
          </SurfaceCard>
        ) : shift.clinic_id ? (
          <SurfaceCard
            onPress={() =>
              router.push(
                getWorkerClinicProfileRoute(
                  shift.clinic_id!,
                  returnContext?.returnTo === 'application-detail'
                    ? returnContext
                    : { returnTo: 'shift-detail', shiftId: shift.id },
                ),
              )
            }>
            <ClinicPostHeader
              clinicName={displayName}
              logoStoragePath={resolveWorkerPostLogoStoragePath(shift)}
              location={placeLabel}
              detail={getSpecialtyLabel(shift.clinic.specialty)}
              detailIcon="medkit-outline"
              metaIcons
              textFooter={statusFooter}
            />
            <ClinicProfileLinkFooter />
          </SurfaceCard>
        ) : null}
        <ShiftPostDetailView
          shift={shift}
          softwareUsed={shift.clinic.software_used}
          section="details"
          locationLabel={shift.location ? location : null}
          postedByLabel={postedByLabel}
          postedOnLabel={postedOnLabel}
        />
        {sourced && hasSourcedContactChannels(shift) ? (
          <SurfaceCard>
            <CardDetailSection title="Contact">
              <SourcedListingContactActions contact={shift} sections="rows" />
            </CardDetailSection>
          </SurfaceCard>
        ) : null}
      </View>
    </FormScreen>
  );
}
