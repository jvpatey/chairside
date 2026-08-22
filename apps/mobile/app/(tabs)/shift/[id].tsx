import {
  getLiveShiftPost,
  getWorkerShiftApplication,
  isShiftPostSaved,
  saveShiftPost,
  unsaveShiftPost,
  ACTIVE_SHIFT_COVER_STATUSES,
  type LiveShiftPost,
  type WorkerApplication,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import {
  CancelledPillBadge,
  RequestedPillBadge,
} from '@/components/matching/ApplicationStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { ClinicProfileLinkFooter } from '@/components/worker/ClinicProfileLinkFooter';
import { SavePostButton } from '@/components/worker/SavePostButton';
import { ShiftUrgencyBadge } from '@/components/worker/ShiftUrgencyBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  getApplyRoute,
  getWorkerApplicationRoute,
  getWorkerClinicProfileRoute,
  getWorkerClinicProfileBackLabel,
  navigateAfterWorkerShift,
  parseWorkerPostingReturnParams,
  type WorkerApplicationReturnTarget,
} from '@/lib/routing';
import { buildPostedByLabel } from '@/hooks/useClinicActingContext';
import { formatPostedDateLabel } from '@/lib/dates';
import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import {
  formatWorkerPostLocation,
  resolveWorkerPostLogoStoragePath,
} from '@/lib/workerPostLocation';
import { guardApply } from '@/lib/workerGuard';
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

  const footerAction =
    applicationView.kind === 'none' ? (
      <OnboardingButton
        label="Request to cover"
        onPress={() =>
          guardApply(workerProfile, isProfileComplete, getApplyRoute('shift', shift.id))
        }
      />
    ) : applicationView.kind === 'pending' ? (
      <OnboardingButton label="Requested" disabled />
    ) : applicationView.kind === 'confirmed' && shiftApplication ? (
      <OnboardingButton
        label="View confirmed fill-in"
        onPress={() =>
          router.push(getWorkerApplicationRoute(shiftApplication.id, applicationReturnTo))
        }
      />
    ) : applicationView.kind === 'cancelled' && shiftApplication ? (
      <OnboardingButton
        label="Request to cover again"
        onPress={() =>
          guardApply(workerProfile, isProfileComplete, getApplyRoute('shift', shift.id))
        }
      />
    ) : null;

  const statusFooter =
    applicationView.kind === 'pending' ? (
      <RequestedPillBadge />
    ) : applicationView.kind === 'cancelled' ? (
      <CancelledPillBadge />
    ) : null;

  const location = formatWorkerPostLocation(shift);
  const postedLabel =
    buildPostedByLabel({
      postedAt: shift.created_at,
      postedByDisplayName: shift.posted_by_display_name,
      postedByTitle: shift.posted_by_title,
      formatDateLabel: formatPostedDateLabel,
    }) ?? null;

  return (
    <FormScreen
      title="Fill-in details"
      subtitle={shift.clinic.clinic_name}
      backLabel={backLabel}
      onBack={goBack}
      headerAccessory={
        user?.id ? <SavePostButton isSaved={isSaved} onToggle={() => void handleToggleSaved()} /> : null
      }
      accent="secondary"
      footer={footerAction}>
      <View style={styles.content}>
        <ShiftPostDetailView
          shift={shift}
          softwareUsed={shift.clinic.software_used}
          section="hero"
          heroAccessory={<ShiftUrgencyBadge urgency={shift.urgency} />}
        />
        <SurfaceCard
          onPress={() =>
            router.push(
              getWorkerClinicProfileRoute(
                shift.clinic.clinic_id,
                returnContext?.returnTo === 'application-detail'
                  ? returnContext
                  : { returnTo: 'shift-detail', shiftId: shift.id },
              ),
            )
          }>
          <ClinicPostHeader
            clinicName={shift.clinic.clinic_name}
            logoStoragePath={resolveWorkerPostLogoStoragePath(shift)}
            location={location || null}
            detail={formatShiftPostMeta(shift)}
            postedLabel={postedLabel}
            textFooter={statusFooter}
          />
          <ClinicProfileLinkFooter />
        </SurfaceCard>
        <ShiftPostDetailView
          shift={shift}
          softwareUsed={shift.clinic.software_used}
          section="details"
        />
      </View>
    </FormScreen>
  );
}
