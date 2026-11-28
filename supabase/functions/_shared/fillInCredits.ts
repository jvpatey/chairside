/**
 * App Store / RevenueCat consumable products that grant fill-in credits.
 *
 * Keep these IDs in sync with:
 *   - App Store Connect (consumable in-app purchase, price tier nearest CA$8)
 *   - RevenueCat product configuration
 *   - packages/config/src/billing.ts (FILL_IN_CREDIT_PRODUCT_IDS)
 */
export const FILL_IN_CREDIT_PRODUCT_IDS: Readonly<Record<string, number>> = {
  fill_in_credit_single: 1,
};

/** Credits granted for a purchased product, or null if the product is not a credit product. */
export function creditsForFillInProduct(productId: string | null | undefined): number | null {
  if (!productId) return null;
  return FILL_IN_CREDIT_PRODUCT_IDS[productId] ?? null;
}
