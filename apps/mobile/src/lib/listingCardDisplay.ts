import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { formatPostedDateLabel } from '@/lib/dates';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ListingMetaRow = {
  icon: IoniconName;
  label: string;
};

export const LISTING_META_ICONS = {
  location: 'location-outline',
  roleType: 'briefcase-outline',
  shiftDetails: 'calendar-outline',
  postedDate: 'time-outline',
} as const satisfies Record<string, IoniconName>;

export function formatListingPostedDate(
  isoTimestamp: string | null | undefined,
): string | null {
  const label = formatPostedDateLabel(isoTimestamp);
  return label || null;
}

function compactMetaRow(icon: IoniconName, label: string | null | undefined): ListingMetaRow | null {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  return { icon, label: trimmed };
}

export function buildRoleListingMetaRows(input: {
  location: string | null | undefined;
  roleMeta: string | null | undefined;
  postedAt: string | null | undefined;
}): ListingMetaRow[] {
  const postedLabel = formatListingPostedDate(input.postedAt);
  return [
    compactMetaRow(LISTING_META_ICONS.location, input.location),
    compactMetaRow(LISTING_META_ICONS.roleType, input.roleMeta),
    compactMetaRow(LISTING_META_ICONS.postedDate, postedLabel),
  ].filter((row): row is ListingMetaRow => row !== null);
}

export function buildFillInListingMetaRows(input: {
  location: string | null | undefined;
  shiftMeta: string | null | undefined;
  postedAt: string | null | undefined;
}): ListingMetaRow[] {
  const postedLabel = formatListingPostedDate(input.postedAt);
  return [
    compactMetaRow(LISTING_META_ICONS.location, input.location),
    compactMetaRow(LISTING_META_ICONS.shiftDetails, input.shiftMeta),
    compactMetaRow(LISTING_META_ICONS.postedDate, postedLabel),
  ].filter((row): row is ListingMetaRow => row !== null);
}
