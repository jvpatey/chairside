import {
  getPublicListing,
  type PublicListing,
  type PublicListingKind,
} from '@chairside/api';
import {
  getEmploymentTypeLabel,
  getRoleTypeLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { Redirect, router, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailProse, DetailRow, RowDivider } from '@/components/clinic/DetailCard';
import { PublicLegalPageHeader } from '@/components/legal/PublicLegalPageHeader';
import { PublicLegalPageShell } from '@/components/legal/PublicLegalPageShell';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { SourcedListingContactActions } from '@/components/worker/SourcedListingContactActions';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { AnalyticsEvents, type ListingOpenSource } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { savePendingPublicListingHref } from '@/lib/pendingPublicListing';
import { isWorkerSetupComplete } from '@/lib/setupCompletion';
import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import { useThemedStyles } from '@/theme';

function locationLabel(listing: PublicListing): string | null {
  const city = listing.city?.trim();
  const province = listing.province?.trim();
  if (city && province) return `${city}, ${province}`;
  if (city) return city;
  if (province) return province;
  return null;
}

function PublicListingBody({ listing }: { listing: PublicListing }) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: {
      gap: spacing.lg,
    },
    clinicName: {
      ...typography.label,
      fontSize: 18,
      color: colors.labelPrimary,
    },
    location: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
      marginTop: spacing.xs,
    },
  }));

  const place = locationLabel(listing);
  const roleLabel = getRoleTypeLabel(listing.role_type);

  return (
    <View style={styles.content}>
      <SurfaceCard>
        <Text style={styles.clinicName}>{listing.clinic_name}</Text>
        {place ? <Text style={styles.location}>{place}</Text> : null}
      </SurfaceCard>

      <SurfaceCard>
        {listing.kind === 'shift' ? (
          <>
            <DetailRow label="Role" value={roleLabel} />
            <RowDivider />
            <DetailRow label="When" value={formatShiftPostMeta(listing)} />
            {listing.compensation?.trim() ? (
              <>
                <RowDivider />
                <DetailRow label="Pay" value={listing.compensation.trim()} />
              </>
            ) : null}
          </>
        ) : (
          <>
            <DetailRow label="Title" value={listing.title} />
            <RowDivider />
            <DetailRow label="Role" value={roleLabel} />
            <RowDivider />
            <DetailRow
              label="Type"
              value={getEmploymentTypeLabel(listing.employment_type)}
            />
            {listing.wage_range?.trim() ? (
              <>
                <RowDivider />
                <DetailRow label="Pay" value={listing.wage_range.trim()} />
              </>
            ) : null}
            {listing.schedule?.trim() ? (
              <>
                <RowDivider />
                <DetailRow label="Schedule" value={listing.schedule.trim()} />
              </>
            ) : null}
            {listing.specialty?.trim() ? (
              <>
                <RowDivider />
                <DetailRow
                  label="Specialty"
                  value={getSpecialtyLabel(listing.specialty)}
                />
              </>
            ) : null}
          </>
        )}
      </SurfaceCard>

      {listing.description?.trim() ? (
        <SurfaceCard>
          <DetailProse text={listing.description.trim()} />
        </SurfaceCard>
      ) : null}
    </View>
  );
}

export function PublicListingPage({
  kind,
  id,
  source = 'direct',
}: {
  kind: PublicListingKind;
  id: string;
  source?: ListingOpenSource;
}) {
  const insets = useSafeAreaInsets();
  const { isCompact } = useResponsiveLayout();
  const { session, profile, isAuthReady } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const [listing, setListing] = useState<PublicListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const openedTrackedRef = useRef<string | null>(null);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    page: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: isCompact ? spacing.md : spacing.lg,
      paddingTop: insets.top + (isCompact ? spacing.md : spacing.lg),
      paddingBottom: insets.bottom + (isCompact ? spacing.lg : spacing.xl),
      alignSelf: 'center' as const,
      width: '100%' as const,
      maxWidth: CONTENT_MAX_WIDTH.regular,
      gap: spacing.lg,
    },
    title: {
      ...typography.title,
      fontSize: isCompact ? 28 : 32,
      lineHeight: isCompact ? 34 : 38,
      letterSpacing: -0.4,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...typography.body,
      color: colors.labelSecondary,
      marginTop: spacing.xs,
    },
    footer: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
  }));

  const inAppHref = (
    kind === 'shift' ? `/(tabs)/shift/${id}` : `/(tabs)/job/${id}`
  ) as Href;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id.trim()) {
        if (!cancelled) {
          setListing(null);
          setIsLoading(false);
          setLoadError(false);
        }
        return;
      }

      setIsLoading(true);
      setLoadError(false);
      try {
        const next = await getPublicListing(kind, id);
        if (!cancelled) setListing(next);
      } catch {
        if (!cancelled) {
          setListing(null);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, kind]);

  useEffect(() => {
    if (!listing || openedTrackedRef.current === listing.id) return;
    openedTrackedRef.current = listing.id;
    captureAnalyticsEvent(AnalyticsEvents.listingOpened, {
      kind: listing.kind,
      listing_id: listing.id,
      is_sourced: listing.is_sourced,
      source,
    });
  }, [listing, source]);

  const handleSignInToApply = useCallback(() => {
    captureAnalyticsEvent(AnalyticsEvents.listingSignInToApplyTapped, {
      kind,
      listing_id: id,
      source,
    });
    void savePendingPublicListingHref(String(inAppHref)).then(() => {
      router.push('/(onboarding)/sign-in');
    });
  }, [id, inAppHref, kind, source]);

  const handleContactTap = useCallback(
    (method: 'phone' | 'email' | 'url') => {
      captureAnalyticsEvent(AnalyticsEvents.listingContactTapped, {
        kind,
        listing_id: id,
        method,
        source,
      });
    },
    [id, kind, source],
  );

  const workerReady =
    isAuthReady &&
    Boolean(session) &&
    profile?.role === 'worker' &&
    isWorkerProfileReady &&
    isWorkerSetupComplete(workerProfile);

  if (workerReady && id.trim()) {
    return <Redirect href={inAppHref} />;
  }

  const title = kind === 'shift' ? 'Fill-in' : 'Role';
  const notFoundSubtitle = loadError
    ? 'Could not load this listing.'
    : 'This listing is no longer available.';

  return (
    <PublicLegalPageShell>
      <ScrollView style={styles.page} contentContainerStyle={styles.scrollContent}>
        <PublicLegalPageHeader />
        <View>
          <Text style={styles.title}>{title}</Text>
          {listing ? (
            <Text style={styles.subtitle}>{listing.clinic_name}</Text>
          ) : !isLoading ? (
            <Text style={styles.subtitle}>{notFoundSubtitle}</Text>
          ) : null}
        </View>

        {isLoading ? <PageLoadingDetail /> : null}
        {listing ? <PublicListingBody listing={listing} /> : null}

        {listing ? (
          <View style={styles.footer}>
            {listing.is_sourced ? (
              <SourcedListingContactActions
                contact={listing}
                onContactTap={handleContactTap}
              />
            ) : (
              <OnboardingButton label="Sign in to apply" onPress={handleSignInToApply} />
            )}
          </View>
        ) : null}
      </ScrollView>
    </PublicLegalPageShell>
  );
}
