import { formatPosterAttribution, type ClinicMembershipRole } from '@chairside/api';

import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';

/** Access-role label for chrome identity (not job title). */
export function getClinicMembershipRoleLabel(
  role?: ClinicMembershipRole | null,
  isOwner?: boolean,
): 'Owner' | 'Manager' {
  if (role === 'owner' || isOwner) return 'Owner';
  return 'Manager';
}

/**
 * Compact identity for group chrome: "Sarah Mitchell · Manager".
 * Prefer membership display name, then fallback name, then role alone.
 */
export function formatClinicMemberIdentity(input: {
  displayName?: string | null;
  fallbackDisplayName?: string | null;
  role?: ClinicMembershipRole | null;
  isOwner?: boolean;
}): string {
  const roleLabel = getClinicMembershipRoleLabel(input.role, input.isOwner);
  const name =
    input.displayName?.trim() || input.fallbackDisplayName?.trim() || '';
  return name ? `${name} · ${roleLabel}` : roleLabel;
}

/** Resolve the organization clinic id and posting attribution for the signed-in member. */
export function useClinicActingContext() {
  const { profile } = useAuth();
  const {
    clinicId,
    membership,
    isGroup,
    isOwner,
    accessibleLocations,
    scopedLocationIds,
    locationScope,
    setLocationScope,
  } = useClinicProfile();

  // Group-only chrome. Individuals may still have a seed membership when the
  // groups flag is on — never surface Owner/Manager identity or attribution.
  const memberIdentityLabel = isGroup
    ? formatClinicMemberIdentity({
        displayName: membership?.display_name,
        fallbackDisplayName: profile?.display_name,
        role: membership?.role,
        isOwner,
      })
    : '';
  const attribution = isGroup
    ? {
        posted_by_membership_id: membership?.id ?? null,
        posted_by_display_name: membership?.display_name ?? null,
        posted_by_title: membership?.title ?? (isOwner ? 'Owner' : 'Manager'),
      }
    : {
        posted_by_membership_id: null,
        posted_by_display_name: null,
        posted_by_title: null,
      };
  const attributionLabel = isGroup
    ? formatPosterAttribution({
        displayName: membership?.display_name,
        title: membership?.title ?? (isOwner ? 'Owner' : 'Manager'),
      })
    : null;

  return {
    clinicId,
    membership,
    isGroup,
    isOwner,
    accessibleLocations,
    scopedLocationIds,
    locationScope,
    setLocationScope,
    memberIdentityLabel,
    attribution,
    attributionLabel,
  };
}

export function buildPostedByLabel(input: {
  postedAt?: string | null;
  postedByDisplayName?: string | null;
  postedByTitle?: string | null;
  formatDateLabel: (iso: string) => string;
}): string | null {
  const attribution = formatPosterAttribution({
    displayName: input.postedByDisplayName,
    title: input.postedByTitle,
  });
  const dateLabel = input.postedAt ? input.formatDateLabel(input.postedAt) : null;
  if (attribution && dateLabel) return `Posted by ${attribution} · ${dateLabel.replace(/^Posted\s+/i, '')}`;
  if (attribution) return `Posted by ${attribution}`;
  return dateLabel;
}
