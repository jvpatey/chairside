import {
  getWorkerDashboardCounts,
  listWorkerShiftApplications,
  type WorkerApplication,
  type WorkerDashboardCounts,
} from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import { formatRoleTypesLabel, WORKER_STATUS_HUB } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DashboardWelcomeCelebration } from '@/components/celebration/DashboardWelcomeCelebration';
import { CoverageFeedSection } from '@/components/dashboard/CoverageFeedSection';
import { DashboardBodyLayout } from '@/components/dashboard/DashboardBodyLayout';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardLoadingShell } from '@/components/dashboard/DashboardLoadingShell';
import { DashboardNeedsAttention } from '@/components/dashboard/DashboardNeedsAttention';
import { DashboardQuickActionsRow } from '@/components/dashboard/DashboardQuickActionsRow';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { FillInAlertsNudgeCard } from '@/components/worker/FillInAlertsNudgeCard';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGetStartedBrowseProgress } from '@/contexts/GetStartedBrowseProgressContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useDashboardWelcomeCelebration } from '@/hooks/useDashboardWelcomeCelebration';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { buildWorkerAttentionItems } from '@/lib/dashboardAttention';
import { partitionWorkerShiftApplications } from '@/lib/fillInFilters';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { getFillInSmsStatus } from '@/lib/fillInAvailabilitySummary';
import { getFirstName } from '@/lib/greeting';
import {
  WORKER_APPLICATIONS,
  WORKER_OPEN_FILLINS,
  WORKER_PENDING_FILLINS,
  WORKER_PROFILE,
  WORKER_PROFILE_NOTIFICATIONS,
} from '@/lib/routing';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const HOME_STATUS_PREVIEW = 6;

export default function WorkerDashboardScreen() {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { visible: welcomeVisible, dismiss: dismissWelcome } = useDashboardWelcomeCelebration({
    role: 'worker',
    userId: user?.id,
  });
  const { pendingCount: applicationUpdateCount, fillInPendingCount } = useApplicationTabBadge();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { photoUri } = useProfilePhoto();
  const { isTablet } = useResponsiveLayout();
  const province = workerProfile?.province ?? 'NS';
  const [counts, setCounts] = useState<WorkerDashboardCounts>({
    openRolesInProvince: 0,
    openFillInsInProvince: 0,
    pendingApplications: 0,
  });
  const [shiftApplications, setShiftApplications] = useState<WorkerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const hasLoadedOnce = useRef(false);
  const { markVisited: markGetStartedBrowseVisited } = useGetStartedBrowseProgress();

  const feedStyles = useThemedStyles(({ spacing, typography }) => ({
    feedStack: {
      gap: spacing.xl,
      width: '100%',
    },
    statusList: {
      gap: spacing.sm,
      width: '100%',
    },
    nearbyLink: {
      alignSelf: 'flex-start' as const,
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    nearbyLinkLabel: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }));

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    setLoadError(false);

    try {
      const [nextCounts, shiftApplicationRows] = await Promise.all([
        getWorkerDashboardCounts(user.id, province),
        listWorkerShiftApplications(user.id),
      ]);

      setCounts(nextCounts);
      setShiftApplications(shiftApplicationRows);
      hasLoadedOnce.current = true;
    } catch {
      setLoadError(true);
      if (!hasLoadedOnce.current) {
        setCounts({ openRolesInProvince: 0, openFillInsInProvince: 0, pendingApplications: 0 });
        setShiftApplications([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [province, user?.id]);

  useRefreshOnFocus(loadDashboard);

  useEffect(() => {
    void markGetStartedBrowseVisited('fillIns');
  }, [markGetStartedBrowseVisited]);

  const { upcomingConfirmed, upcomingInProgress } = useMemo(
    () => partitionWorkerShiftApplications(shiftApplications),
    [shiftApplications],
  );

  const myFillIns = useMemo(() => {
    const merged = [...upcomingConfirmed, ...upcomingInProgress];
    return merged.slice(0, HOME_STATUS_PREVIEW);
  }, [upcomingConfirmed, upcomingInProgress]);

  const attentionItems = useMemo(
    () =>
      buildWorkerAttentionItems({
        applicationUpdateCount,
        fillInPendingCount,
        onOpenApplications: () => router.push(WORKER_APPLICATIONS),
        onOpenFillIns: () => router.push(WORKER_PENDING_FILLINS),
      }),
    [applicationUpdateCount, fillInPendingCount],
  );

  const workerSubtitle =
    (workerProfile && formatRoleTypesLabel(getWorkerRoleTypes(workerProfile))) ||
    'Dental professional';

  const locationLine = [workerProfile?.city, workerProfile?.province]
    .filter(Boolean)
    .join(', ');

  const heroSubtitle = isProfileComplete
    ? [workerSubtitle, locationLine || null].filter(Boolean).join(' · ')
    : 'Finish your profile setup';

  const smsStatus = getFillInSmsStatus(workerProfile);
  const pendingLabel =
    upcomingInProgress.length === 1
      ? '1 request pending'
      : upcomingInProgress.length > 0
        ? `${upcomingInProgress.length} requests pending`
        : null;
  const confirmedLabel =
    upcomingConfirmed.length === 1
      ? '1 confirmed fill-in'
      : upcomingConfirmed.length > 0
        ? `${upcomingConfirmed.length} confirmed fill-ins`
        : null;
  const smsStatusLabel = smsStatus.smsActive
    ? 'Text alerts on'
    : smsStatus.smsNeedsPhone
      ? 'Add phone for texts'
      : smsStatus.fillInsOn
        ? 'Text alerts off'
        : null;
  const homeStatusLine = isProfileComplete
    ? [smsStatusLabel, confirmedLabel, pendingLabel].filter(Boolean).join(' · ') ||
      'We’ll text you when a fill-in opens nearby'
    : null;

  const statusHub = WORKER_STATUS_HUB;
  const hasActiveFillIns = myFillIns.length > 0;

  const dashboardBody = (
    <DashboardBodyLayout
      hero={
        <FadeInSection delayMs={0}>
          <DashboardHero
            flush
            profileHref={WORKER_PROFILE}
            avatarKind="worker"
            displayName={isProfileComplete ? profile?.display_name : null}
            photoUri={isProfileComplete ? photoUri : null}
            namePlaceholder={isProfileComplete ? 'Your profile' : 'Welcome to Chairside'}
            subtitle={heroSubtitle}
            greetingName={isProfileComplete ? getFirstName(profile?.display_name) : null}
            statusLine={homeStatusLine}
            onStatusPress={
              smsStatusLabel && !smsStatus.smsActive
                ? () => router.push(WORKER_PROFILE_NOTIFICATIONS)
                : () => router.push(WORKER_PENDING_FILLINS)
            }
            hideProfileOnWebTablet
          />
        </FadeInSection>
      }
      error={
        loadError ? (
          <FadeInSection>
            <DashboardErrorBanner onRetry={() => void loadDashboard()} />
          </FadeInSection>
        ) : null
      }
      needsAttention={
        attentionItems.length > 0 ? (
          <DashboardNeedsAttention items={attentionItems} />
        ) : null
      }
      alerts={
        isProfileComplete ? (
          <FillInAlertsNudgeCard openFillInCount={counts.openFillInsInProvince} />
        ) : null
      }
      quickActions={
        isTablet ? null : (
          <FadeInSection delayMs={100}>
            <DashboardQuickActionsRow
              emphasizeFirst
              actions={[
                {
                  label: 'My fill-ins',
                  description: 'Requests & confirmed',
                  icon: FILL_IN_ICON.outline,
                  variant: 'primary',
                  onPress: () => router.push(WORKER_PENDING_FILLINS),
                },
                {
                  label: 'Text alerts',
                  description: smsStatus.smsActive ? 'On' : 'Set up',
                  icon: 'chatbubble-ellipses-outline',
                  variant: 'primary',
                  onPress: () => router.push(WORKER_PROFILE_NOTIFICATIONS),
                },
              ]}
            />
          </FadeInSection>
        )
      }
      workspace={
        <FadeInSection delayMs={120}>
          <View style={feedStyles.feedStack}>
            {statusHub ? (
              <CoverageFeedSection
                title="My fill-ins"
                count={hasActiveFillIns ? myFillIns.length : undefined}
                accent="primary"
                icon={FILL_IN_ICON.outline}
                onViewAll={hasActiveFillIns ? () => router.push(WORKER_PENDING_FILLINS) : undefined}>
                {hasActiveFillIns ? (
                  <View style={feedStyles.statusList}>
                    {myFillIns.map((application) => (
                      <WorkerApplicationListCard
                        key={application.id}
                        application={application}
                        returnTo="dashboard-fill-ins"
                        compact
                      />
                    ))}
                  </View>
                ) : (
                  <DashboardEmptyState
                    icon={FILL_IN_ICON.outline}
                    title="No active fill-ins"
                    message="We’ll text you when a clinic needs cover."
                    accent="primary"
                  />
                )}
              </CoverageFeedSection>
            ) : null}

            {isProfileComplete ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="See nearby open fill-ins"
                onPress={() => router.push(WORKER_OPEN_FILLINS)}
                style={({ pressed, hovered }) => [
                  feedStyles.nearbyLink,
                  webHover(hovered, pressed, webListRowHoverStyles(colors)),
                  pressed && { opacity: 0.85 },
                ]}>
                <Text style={feedStyles.nearbyLinkLabel}>Nearby open fill-ins</Text>
              </Pressable>
            ) : null}
          </View>
        </FadeInSection>
      }
    />
  );

  return (
    <DashboardScreen>
      <DashboardWelcomeCelebration
        visible={welcomeVisible}
        role="worker"
        onDismiss={() => void dismissWelcome()}
      />
      {isLoading && !hasLoadedOnce.current ? <DashboardLoadingShell /> : dashboardBody}
    </DashboardScreen>
  );
}
