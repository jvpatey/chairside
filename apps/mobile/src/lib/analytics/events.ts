export const AnalyticsEvents = {
  listingOpened: 'listing_opened',
  listingContactTapped: 'listing_contact_tapped',
  listingSignInToApplyTapped: 'listing_sign_in_to_apply_tapped',
  applyStarted: 'apply_started',
  coverRequested: 'cover_requested',
  applySubmitted: 'apply_submitted',
  authSignedIn: 'auth_signed_in',
} as const;

export type ListingOpenSource = 'sms' | 'share' | 'direct';

export function parseListingOpenSource(raw: string | string[] | undefined): ListingOpenSource {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'sms' || value === 'share') return value;
  return 'direct';
}
