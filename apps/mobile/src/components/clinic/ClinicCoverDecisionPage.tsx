import {
  decideFillInFromSms,
  getFillInDecisionPreview,
  type FillInDecisionPreview,
  type FillInDecisionState,
} from '@chairside/api';
import { getRoleTypeLabel } from '@chairside/config';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { PublicLegalPageHeader } from '@/components/legal/PublicLegalPageHeader';
import { PublicLegalPageShell } from '@/components/legal/PublicLegalPageShell';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { AnalyticsEvents, type ListingOpenSource } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
import {
  getClinicApplicationRoute,
} from '@/lib/routing';
import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import { useThemedStyles } from '@/theme';

const DECISION_MAX_WIDTH = 600;

function statusCopy(state: FillInDecisionState): { title: string; body: string } {
  switch (state) {
    case 'pending':
      return {
        title: 'Cover request',
        body: 'Accept to confirm this professional for your fill-in. Other pending requests for this shift will be declined.',
      };
    case 'accepted':
      return {
        title: 'Coverage confirmed',
        body: 'This professional is confirmed for the fill-in. They’ll get a text with the details.',
      };
    case 'declined':
      return {
        title: 'Request declined',
        body: 'This cover request was declined. Other requests for the fill-in stay open.',
      };
    case 'filled_other':
      return {
        title: 'Already covered',
        body: 'This fill-in was filled with someone else.',
      };
    case 'expired':
      return {
        title: 'Link expired',
        body: 'This decision link has expired. Open Chairside to review cover requests.',
      };
    case 'already_decided':
      return {
        title: 'Already decided',
        body: 'A decision was already recorded for this request.',
      };
    default:
      return {
        title: 'Unavailable',
        body: 'This cover request can’t be decided from this link. Open Chairside to continue.',
      };
  }
}

export function ClinicCoverDecisionPage({
  applicationId,
  token,
  source = 'direct',
}: {
  applicationId: string;
  token: string;
  source?: ListingOpenSource;
}) {
  const insets = useSafeAreaInsets();
  const { isCompact } = useResponsiveLayout();
  const { session, profile, isAuthReady, isProfileReady } = useAuth();
  const [preview, setPreview] = useState<FillInDecisionPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const openedTrackedRef = useRef<string | null>(null);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: { flex: 1 },
    page: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: isCompact ? spacing.md : spacing.lg,
      paddingTop: insets.top + (isCompact ? spacing.md : spacing.lg),
      paddingBottom: isCompact ? spacing.xl + 8 : insets.bottom + spacing.xl,
      alignSelf: 'center' as const,
      width: '100%' as const,
      maxWidth: DECISION_MAX_WIDTH,
      gap: spacing.lg,
    },
    hero: { gap: spacing.sm },
    title: {
      ...typography.title,
      fontSize: isCompact ? 28 : 34,
      lineHeight: isCompact ? 34 : 40,
      letterSpacing: -0.5,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
    facts: { gap: spacing.md },
    factRow: { gap: spacing.xs },
    factLabel: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    factValue: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
    stickyFooter: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: insets.bottom + spacing.md,
      gap: spacing.sm,
      alignSelf: 'center' as const,
      width: '100%' as const,
      maxWidth: DECISION_MAX_WIDTH,
    },
    errorText: {
      ...typography.subtitle,
      color: colors.danger,
      textAlign: 'center' as const,
    },
    statusBanner: {
      backgroundColor: colors.secondarySubtle,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    statusTitle: {
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    statusBody: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  const load = useCallback(async () => {
    if (!applicationId.trim() || !token.trim()) {
      setPreview(null);
      setIsLoading(false);
      setLoadError(false);
      return;
    }

    setIsLoading(true);
    setLoadError(false);
    try {
      const next = await getFillInDecisionPreview(applicationId, token);
      setPreview(next);
      if (!next) setLoadError(true);
    } catch {
      setPreview(null);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!preview || openedTrackedRef.current === preview.application_id) return;
    openedTrackedRef.current = preview.application_id;
    captureAnalyticsEvent(AnalyticsEvents.coverDecisionOpened, {
      application_id: preview.application_id,
      decision_state: preview.decision_state,
      source,
    });
  }, [preview, source]);

  const handleDecide = useCallback(
    async (decision: 'accept' | 'decline') => {
      if (!preview || preview.decision_state !== 'pending' || isSubmitting) return;
      setIsSubmitting(true);
      setActionError(null);
      try {
        const result = await decideFillInFromSms(applicationId, token, decision);
        captureAnalyticsEvent(
          decision === 'accept'
            ? AnalyticsEvents.coverDecisionAccepted
            : AnalyticsEvents.coverDecisionDeclined,
          {
            application_id: applicationId,
            outcome: result.outcome,
            source,
          },
        );
        await load();
      } catch {
        setActionError('Could not save your decision. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [applicationId, isSubmitting, load, preview, source, token],
  );

  // Signed-in clinic without a token falls through to in-app routing in the screen.
  // With a valid token, always show the companion so SMS decisions work even while signed in.

  if (!applicationId.trim()) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (isLoading || !isAuthReady || (session && !isProfileReady)) {
    return (
      <PublicLegalPageShell>
        <PageLoadingDetail />
      </PublicLegalPageShell>
    );
  }

  if (loadError || !preview) {
    const canOpenInApp =
      Boolean(session?.user?.id) && profile?.role === 'clinic';
    return (
      <PublicLegalPageShell>
        <View style={styles.scrollContent}>
          <PublicLegalPageHeader />
          <Text style={styles.title}>Cover request</Text>
          <Text style={styles.subtitle}>
            This decision link is invalid or no longer available.
          </Text>
          {canOpenInApp ? (
            <OnboardingButton
              label="Open in Chairside"
              accent="secondary"
              onPress={() =>
                router.replace(
                  getClinicApplicationRoute(applicationId, 'dashboard-fill-ins') as never,
                )
              }
            />
          ) : (
            <OnboardingButton
              label="Sign in"
              accent="secondary"
              onPress={() => router.push('/(onboarding)/sign-in' as never)}
            />
          )}
        </View>
      </PublicLegalPageShell>
    );
  }

  const copy = statusCopy(preview.decision_state);
  const whenLabel = formatShiftPostMeta({
    shift_date: preview.shift_date,
    start_time: preview.start_time,
    end_time: preview.end_time,
  });
  const showActions = preview.decision_state === 'pending';

  return (
    <PublicLegalPageShell>
      <View style={styles.root}>
        <WebPageEnter style={styles.page}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <PublicLegalPageHeader />
            <View style={styles.hero}>
              <Text style={styles.title}>{preview.worker_name}</Text>
              <Text style={styles.subtitle}>
                Requested your fill-in at {preview.clinic_name}
              </Text>
            </View>

            <SurfaceCard>
              <View style={styles.facts}>
                <View style={styles.factRow}>
                  <Text style={styles.factLabel}>Role</Text>
                  <Text style={styles.factValue}>{getRoleTypeLabel(preview.role_type)}</Text>
                </View>
                {whenLabel ? (
                  <View style={styles.factRow}>
                    <Text style={styles.factLabel}>When</Text>
                    <Text style={styles.factValue}>{whenLabel}</Text>
                  </View>
                ) : null}
                {preview.compensation?.trim() ? (
                  <View style={styles.factRow}>
                    <Text style={styles.factLabel}>Pay</Text>
                    <Text style={styles.factValue}>{preview.compensation.trim()}</Text>
                  </View>
                ) : null}
              </View>
            </SurfaceCard>

            {!showActions ? (
              <View style={styles.statusBanner}>
                <Text style={styles.statusTitle}>{copy.title}</Text>
                <Text style={styles.statusBody}>{copy.body}</Text>
              </View>
            ) : (
              <View style={styles.statusBanner}>
                <Text style={styles.statusBody}>{copy.body}</Text>
              </View>
            )}
          </ScrollView>

          {showActions ? (
            <View style={styles.stickyFooter}>
              {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
              <OnboardingButton
                label={isSubmitting ? 'Confirming…' : 'Accept cover'}
                accent="secondary"
                disabled={isSubmitting}
                onPress={() => void handleDecide('accept')}
              />
              <OnboardingButton
                label={isSubmitting ? 'Working…' : 'Decline'}
                accent="primary"
                variant="ghost"
                disabled={isSubmitting}
                onPress={() => void handleDecide('decline')}
              />
            </View>
          ) : null}
        </WebPageEnter>
      </View>
    </PublicLegalPageShell>
  );
}
