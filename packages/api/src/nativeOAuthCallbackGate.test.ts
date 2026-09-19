import { describe, expect, it } from 'vitest';

import {
  clearNativeOAuthCallbackHandled,
  consumeNativeOAuthCallbackHandled,
  markNativeOAuthCallbackHandled,
  peekNativeOAuthCallbackHandled,
  resetNativeOAuthCallbackGateForTests,
} from './nativeOAuthCallbackGate';

describe('nativeOAuthCallbackGate', () => {
  it('marks, peeks, and consumes once', () => {
    resetNativeOAuthCallbackGateForTests();
    expect(peekNativeOAuthCallbackHandled()).toBe(false);

    markNativeOAuthCallbackHandled();
    expect(peekNativeOAuthCallbackHandled()).toBe(true);
    expect(consumeNativeOAuthCallbackHandled()).toBe(true);
    expect(consumeNativeOAuthCallbackHandled()).toBe(false);
    expect(peekNativeOAuthCallbackHandled()).toBe(false);
  });

  it('clears without consuming', () => {
    resetNativeOAuthCallbackGateForTests();
    markNativeOAuthCallbackHandled();
    clearNativeOAuthCallbackHandled();
    expect(consumeNativeOAuthCallbackHandled()).toBe(false);
  });
});
