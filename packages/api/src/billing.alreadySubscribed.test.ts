import { describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  getSupabaseClient: () => ({ rpc: vi.fn(), functions: { invoke: vi.fn() } }),
}));

import { isAlreadySubscribedPurchaseError } from './billing';

describe('isAlreadySubscribedPurchaseError', () => {
  it('matches common already-subscribed messages', () => {
    expect(isAlreadySubscribedPurchaseError(new Error('Already subscribed to Clinic Starter'))).toBe(
      true,
    );
    expect(isAlreadySubscribedPurchaseError(new Error('You already own this product'))).toBe(true);
    expect(
      isAlreadySubscribedPurchaseError(new Error('Product already purchased for this account')),
    ).toBe(true);
  });

  it('ignores cancel and unrelated purchase failures', () => {
    expect(isAlreadySubscribedPurchaseError(new Error('Purchase cancelled.'))).toBe(false);
    expect(isAlreadySubscribedPurchaseError(new Error('Network request failed'))).toBe(false);
    expect(isAlreadySubscribedPurchaseError(null)).toBe(false);
  });
});
