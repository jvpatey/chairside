export const SCREENING_REVIEW_DISMISS_KEY = 'chairside.clinic.screeningReview.dismissed.v1';

export function parseDismissedScreeningReviewIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}
