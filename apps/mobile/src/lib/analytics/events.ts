export const AnalyticsEvents = {
  listingOpened: 'listing_opened',
  listingContactRevealed: 'listing_contact_revealed',
  listingContactTapped: 'listing_contact_tapped',
  listingContactCopied: 'listing_contact_copied',
  listingSignInToApplyTapped: 'listing_sign_in_to_apply_tapped',
  applyStarted: 'apply_started',
  coverRequested: 'cover_requested',
  applySubmitted: 'apply_submitted',
  authSignedIn: 'auth_signed_in',
  coverDecisionOpened: 'cover_decision_opened',
  coverDecisionAccepted: 'cover_decision_accepted',
  coverDecisionDeclined: 'cover_decision_declined',
  clinicSignupAccountTypeSelected: 'clinic_signup_account_type_selected',
  clinicSignupAddressSaved: 'clinic_signup_address_saved',
  clinicSignupAddAnotherTapped: 'clinic_signup_add_another_tapped',
  clinicSignupAddressSkipped: 'clinic_signup_address_skipped',
  clinicSignupLocationAdded: 'clinic_signup_location_added',
  clinicSignupLocationLimitHit: 'clinic_signup_location_limit_hit',
  clinicAddClinicNudgeTapped: 'clinic_add_clinic_nudge_tapped',
  clinicAddClinicNudgeDismissed: 'clinic_add_clinic_nudge_dismissed',
  clinicLocationAddedLater: 'clinic_location_added_later',
} as const;

export type ListingOpenSource = 'sms' | 'share' | 'direct';

export function parseListingOpenSource(raw: string | string[] | undefined): ListingOpenSource {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'sms' || value === 'share') return value;
  return 'direct';
}
