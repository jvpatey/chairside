import type { ShiftPost } from '@chairside/api';
import { router } from 'expo-router';
import { LayoutAnimation, Platform, UIManager, View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { ShiftPostManageMenu } from '@/components/clinic/ShiftPostManageMenu';
import { ShiftPostStatusBadge } from '@/components/clinic/ShiftPostStatusBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CountBadge, formatRequestCountLabel } from '@/components/ui/CountBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ExpandableSurfaceCard } from '@/components/ui/ExpandableSurfaceCard';
import { ListingClinicSubtitle } from '@/components/ui/ListingMetaIconRow';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { useClinicBilling } from '@/contexts/ClinicBillingContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useResolvedClinicLogoPath } from '@/hooks/useResolvedClinicLogoPath';
import { resolveClinicJobLocationLabel, resolveClinicJobLocationParts } from '@/lib/clinicPostingListDisplay';
import { buildFillInListingMetaRows } from '@/lib/listingCardDisplay';
import {
  formatShiftPostMeta,
  formatShiftPostRoleTitle,
} from '@/lib/shiftPostDisplay';
import {
  getClinicShiftApplicantsRoute,
  getEditShiftRoute,
  type FillInReturnTarget,
} from '@/lib/routing';
import { useThemedStyles, type GradientAccent } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FillInPostingCardProps = {
  shift: ShiftPost;
  pendingRequestCount?: number;
  applicationCount?: number;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  clinicId?: string;
  returnTo?: FillInReturnTarget;
  onShiftUpdated?: (shift: ShiftPost) => void;
  onShiftDeleted?: () => void;
  accent?: GradientAccent;
  embedded?: boolean;
};

export function FillInPostingCard({
  shift,
  pendingRequestCount = 0,
  applicationCount = 0,
  expanded = false,
  onExpandChange,
  clinicId,
  returnTo = 'fill-ins-tab',
  onShiftUpdated,
  onShiftDeleted,
  accent = 'secondary',
  embedded = false,
}: FillInPostingCardProps) {
  const { billing } = useClinicBilling();
  const featuredTreatment = useFeaturedListingTreatment(accent);
  const { clinicProfile, locations, isGroup } = useClinicProfile();
  const logoStoragePath = useResolvedClinicLogoPath(shift.location_id);
  const logoUri = useClinicLogoUri(logoStoragePath);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const { siteName, placeLabel } = resolveClinicJobLocationParts(shift, locations, clinicProfile);
  const location = resolveClinicJobLocationLabel(shift, locations, clinicProfile);
  const subtitleName = isGroup ? siteName || clinicName : clinicName;
  const shiftMeta = formatShiftPostMeta(shift);
  const metaRows = buildFillInListingMetaRows({
    location: placeLabel,
    shiftMeta,
    postedAt: shift.created_at,
  });

  const styles = useThemedStyles(({ spacing }) => ({
    actions: {
      gap: spacing.sm,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
  }));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onExpandChange?.(!expanded);
  };

  const reviewLabel =
    applicationCount === 1 ? 'Review applicant' : `Review ${applicationCount} applicants`;
  const isFeatured = shift.status === 'live' && Boolean(billing?.hasPriorityListing);

  const header = (
    <BrowseListRow
      paddingless
      avatar={<ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={44} />}
      title={formatShiftPostRoleTitle(shift.role_type)}
      subtitle={<ListingClinicSubtitle name={subtitleName} isGroup={isGroup} />}
      metaRows={metaRows}
      topTrailing={
        <BadgeRow>
          {isFeatured ? <FeaturedListingBadge accent={accent} /> : null}
          <ShiftPostStatusBadge status={shift.status} shiftDate={shift.shift_date} />
        </BadgeRow>
      }
      contentAccessory={
        pendingRequestCount > 0 ? (
          <CountBadge label={formatRequestCountLabel(pendingRequestCount)} />
        ) : null
      }
      showChevron={false}
    />
  );

  return (
    <ExpandableSurfaceCard
      header={header}
      expanded={expanded}
      onToggleExpand={toggleExpanded}
      variant={embedded ? 'inner' : 'default'}
      accent={accent}
      style={isFeatured ? featuredTreatment.cardStyle : undefined}
      accentRailColor={isFeatured ? featuredTreatment.railColor : undefined}>
      <ShiftPostDetailView
        shift={shift}
        variant="embedded"
        showStatusBadge={false}
        accent={accent}
        locationLabel={isGroup ? location || null : null}
      />
      <View style={styles.actions}>
        {applicationCount > 0 ? (
          <OnboardingButton
            label={reviewLabel}
            accent={accent}
            onPress={() => router.push(getClinicShiftApplicantsRoute(shift.id, returnTo))}
          />
        ) : null}
        <View style={styles.actionsRow}>
          <OnboardingButton
            style={styles.actionButton}
            label="Edit fill-in"
            variant={applicationCount > 0 ? 'secondary' : 'primary'}
            accent={applicationCount > 0 ? 'primary' : accent}
            onPress={() => router.push(getEditShiftRoute(shift.id, returnTo))}
          />
          {clinicId ? (
            <ShiftPostManageMenu
              trigger={applicationCount > 0 ? 'icon' : 'button'}
              style={applicationCount > 0 ? undefined : styles.actionButton}
              clinicId={clinicId}
              shift={shift}
              onUpdated={onShiftUpdated ?? (() => undefined)}
              onDeleted={onShiftDeleted ?? (() => undefined)}
            />
          ) : null}
        </View>
      </View>
    </ExpandableSurfaceCard>
  );
}
