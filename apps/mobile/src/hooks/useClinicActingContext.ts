import { formatPosterAttribution } from '@chairside/api';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';

/** Resolve the organization clinic id and posting attribution for the signed-in member. */
export function useClinicActingContext() {
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

  return {
    clinicId,
    membership,
    isGroup,
    isOwner,
    accessibleLocations,
    scopedLocationIds,
    locationScope,
    setLocationScope,
    attribution: {
      posted_by_membership_id: membership?.id ?? null,
      posted_by_display_name: membership?.display_name ?? null,
      posted_by_title: membership?.title ?? (isOwner ? 'Owner' : 'Manager'),
    },
    attributionLabel: formatPosterAttribution({
      displayName: membership?.display_name,
      title: membership?.title ?? (isOwner ? 'Owner' : 'Manager'),
    }),
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
