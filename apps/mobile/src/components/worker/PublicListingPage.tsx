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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailProse } from '@/components/clinic/DetailCard';
import { PublicLegalPageHeader } from '@/components/legal/PublicLegalPageHeader';
import { PublicLegalPageShell } from '@/components/legal/PublicLegalPageShell';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { PillBadge } from '@/components/ui/PillBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { SourcedListingContactActions } from '@/components/worker/SourcedListingContactActions';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { AnalyticsEvents, type ListingOpenSource } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
import { savePendingPublicListingHref } from '@/lib/pendingPublicListing';
import { canAccessWorkerTabs } from '@/lib/setupCompletion';
import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import { useTheme, useThemedStyles } from '@/theme';

/** Tighter reading width than app dashboards — listing feels intentional on iPad. */
const PUBLIC_LISTING_MAX_WIDTH = 600;

function locationLabel(listing: PublicListing): string | null {
  const city = listing.city?.trim();
  const province = listing.province?.trim();
  if (city && province) return `${city}, ${province}`;
  if (city) return city;
  if (province) return province;
  return null;
}

type Fact = { label: string; value: string };

function listingFacts(listing: PublicListing): Fact[] {
  const roleLabel = getRoleTypeLabel(listing.role_type);
  if (listing.kind === 'shift') {
    const facts: Fact[] = [
      { label: 'Role', value: roleLabel },
      { label: 'When', value: formatShiftPostMeta(listing) },
    ];
    if (listing.compensation?.trim()) {
      facts.push({ label: 'Pay', value: listing.compensation.trim() });
    }
    return facts;
  }

  const facts: Fact[] = [
    { label: 'Title', value: listing.title },
    { label: 'Role', value: roleLabel },
    { label: 'Type', value: getEmploymentTypeLabel(listing.employment_type) },
  ];
  if (listing.wage_range?.trim()) {
    facts.push({ label: 'Pay', value: listing.wage_range.trim() });
  }
  if (listing.schedule?.trim()) {
    facts.push({ label: 'Schedule', value: listing.schedule.trim() });
  }
  if (listing.specialty?.trim()) {
    facts.push({ label: 'Specialty', value: getSpecialtyLabel(listing.specialty) });
  }
  return facts;
}

function FactGrid({ facts, twoColumn }: { facts: Fact[]; twoColumn: boolean }) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    grid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.md,
    },
    tile: {
      gap: spacing.xs,
      ...(twoColumn
        ? {
            width: '47%' as const,
            flexGrow: 1,
            minWidth: 140,
          }
        : {
            width: '100%' as const,
          }),
    },
    tileDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      paddingBottom: spacing.sm,
      marginBottom: spacing.xs,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    value: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
  }));

  return (
    <View style={styles.grid}>
      {facts.map((fact, index) => {
        const isLast = index === facts.length - 1;
        const showDivider = !twoColumn && !isLast;
        return (
          <View
            key={`${fact.label}-${index}`}
            style={[styles.tile, showDivider && styles.tileDivider]}>
            <Text style={styles.label}>{fact.label}</Text>
            <Text style={styles.value}>{fact.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

function PublicListingBody({
  listing,
  twoColumn,
  showSmsHint,
}: {
  listing: PublicListing;
  twoColumn: boolean;
  showSmsHint?: boolean;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: {
      gap: spacing.lg,
    },
    smsHint: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    contactLabel: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
      marginBottom: spacing.xs,
    },
    contactValue: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
  }));

  const facts = useMemo(() => listingFacts(listing), [listing]);
  const description = listing.description?.trim() || null;
  const contactPhone = listing.contact_phone?.trim() || null;

  return (
    <View style={styles.content}>
      {showSmsHint && listing.kind === 'shift' && !listing.is_sourced ? (
        <Text style={styles.smsHint}>
          Prefer text? Reply YES to the Chairside message to request this cover without signing in
          first. Or sign in below to request from the app.
        </Text>
      ) : null}

      <SurfaceCard>
        <FactGrid facts={facts} twoColumn={twoColumn} />
      </SurfaceCard>

      {contactPhone ? (
        <SurfaceCard>
          <Text style={styles.contactLabel}>Clinic contact</Text>
          <Text style={styles.contactValue}>{contactPhone}</Text>
        </SurfaceCard>
      ) : null}

      {description ? (
        <SurfaceCard>
          <DetailProse text={description} />
        </SurfaceCard>
      ) : null}
    </View>
  );
}

function ListingCtaFooter({
  listing,
  onSignInToApply,
  onContactTap,
  onContactReveal,
  onContactCopy,
}: {
  listing: PublicListing;
  onSignInToApply: () => void;
  onContactTap: (method: 'phone' | 'email' | 'url') => void;
  onContactReveal: (method: 'phone' | 'email') => void;
  onContactCopy: (method: 'phone' | 'email') => void;
}) {
  if (listing.is_sourced) {
    return (
      <SourcedListingContactActions
        contact={listing}
        revealBeforeShow
        onContactTap={onContactTap}
        onContactReveal={onContactReveal}
        onContactCopy={onContactCopy}
      />
    );
  }

  return (
    <OnboardingButton
      label={
        listing.kind === 'shift'
          ? 'Sign in to request cover'
          : 'Sign in to apply'
      }
      accent="primary"
      onPress={onSignInToApply}
    />
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
  const { colors } = useTheme();
  const { isCompact } = useResponsiveLayout();
  const { session, profile, isAuthReady } = useAuth();
  const { isWorkerProfileReady } = useWorkerProfile();
  const [listing, setListing] = useState<PublicListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const openedTrackedRef = useRef<string | null>(null);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      flex: 1,
    },
    page: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: isCompact ? spacing.md : spacing.lg,
      paddingTop: insets.top + (isCompact ? spacing.md : spacing.lg),
      paddingBottom: isCompact
        ? spacing.xl + 8
        : insets.bottom + spacing.xl,
      alignSelf: 'center' as const,
      width: '100%' as const,
      maxWidth: PUBLIC_LISTING_MAX_WIDTH,
      gap: spacing.lg,
    },
    hero: {
      gap: spacing.sm,
    },
    clinicName: {
      ...typography.title,
      fontSize: isCompact ? 28 : 34,
      lineHeight: isCompact ? 34 : 40,
      letterSpacing: -0.5,
      color: colors.labelPrimary,
    },
    location: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 22,
      color: colors.labelSecondary,
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
      maxWidth: PUBLIC_LISTING_MAX_WIDTH,
    },
    inlineFooter: {
      gap: spacing.sm,
      marginTop: spacing.sm,
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

  const handleContactReveal = useCallback(
    (method: 'phone' | 'email') => {
      captureAnalyticsEvent(AnalyticsEvents.listingContactRevealed, {
        kind,
        listing_id: id,
        method,
        source,
      });
    },
    [id, kind, source],
  );

  const handleContactCopy = useCallback(
    (method: 'phone' | 'email') => {
      captureAnalyticsEvent(AnalyticsEvents.listingContactCopied, {
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
    canAccessWorkerTabs(profile) &&
    isWorkerProfileReady;

  if (workerReady && id.trim()) {
    return <Redirect href={inAppHref} />;
  }

  const notFoundSubtitle = loadError
    ? 'Could not load this listing.'
    : 'This listing is no longer available.';

  const kindLabel = kind === 'shift' ? 'Fill-in' : 'Role';
  const kindAccent = {
    color: colors.primary,
    backgroundColor: colors.primarySubtle,
  };

  const place = listing ? locationLabel(listing) : null;
  const stickyCta = Boolean(isCompact && listing);

  const ctaProps = listing
    ? {
        listing,
        onSignInToApply: handleSignInToApply,
        onContactTap: handleContactTap,
        onContactReveal: handleContactReveal,
        onContactCopy: handleContactCopy,
      }
    : null;

  return (
    <PublicLegalPageShell>
      <View style={styles.root}>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <PublicLegalPageHeader />

          <WebPageEnter style={styles.hero}>
            <PillBadge
              label={kindLabel}
              color={kindAccent.color}
              backgroundColor={kindAccent.backgroundColor}
              size="sm"
            />
            {listing ? (
              <>
                <Text style={styles.clinicName}>{listing.clinic_name}</Text>
                {place ? <Text style={styles.location}>{place}</Text> : null}
              </>
            ) : !isLoading ? (
              <>
                <Text style={styles.clinicName}>{kindLabel}</Text>
                <Text style={styles.location}>{notFoundSubtitle}</Text>
              </>
            ) : (
              <Text style={styles.clinicName}>{kindLabel}</Text>
            )}
          </WebPageEnter>

          {isLoading ? <PageLoadingDetail /> : null}

          {listing ? (
            <WebPageEnter delayMs={120}>
              <PublicListingBody
                listing={listing}
                twoColumn={!isCompact}
                showSmsHint={source === 'sms'}
              />
            </WebPageEnter>
          ) : null}

          {listing && !stickyCta && ctaProps ? (
            <WebPageEnter delayMs={200} style={styles.inlineFooter}>
              <ListingCtaFooter {...ctaProps} />
            </WebPageEnter>
          ) : null}
        </ScrollView>

        {stickyCta && ctaProps ? (
          <View style={styles.stickyFooter}>
            <ListingCtaFooter {...ctaProps} />
          </View>
        ) : null}
      </View>
    </PublicLegalPageShell>
  );
}
