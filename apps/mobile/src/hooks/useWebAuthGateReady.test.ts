import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  hasAuthCallbackParams: vi.fn(),
}));

import { hasAuthCallbackParams } from '@chairside/api';

import {
  isWebAuthGateReady,
  markWebAuthLinkHandled,
  resetWebAuthGateForTests,
  setWebAuthGateStatus,
} from '@/lib/webAuthCallbackGate';

describe('isWebAuthGateReady', () => {
  beforeEach(() => {
    resetWebAuthGateForTests();
    vi.mocked(hasAuthCallbackParams).mockReturnValue(false);
  });

  it('is ready when there are no auth callback params', () => {
    vi.mocked(hasAuthCallbackParams).mockReturnValue(false);
    expect(isWebAuthGateReady('https://example.com/')).toBe(true);
  });

  it('blocks while the callback handler is processing', () => {
    vi.mocked(hasAuthCallbackParams).mockReturnValue(true);
    setWebAuthGateStatus('processing');
    expect(isWebAuthGateReady('https://example.com/auth/callback?code=abc')).toBe(false);
  });

  it('blocks when params are present but the link has not been handled yet', () => {
    vi.mocked(hasAuthCallbackParams).mockReturnValue(true);
    setWebAuthGateStatus('idle');
    expect(isWebAuthGateReady('https://example.com/auth/callback?code=abc')).toBe(false);
  });

  it('is ready after the link is handled and the gate is idle', () => {
    vi.mocked(hasAuthCallbackParams).mockReturnValue(true);
    markWebAuthLinkHandled();
    setWebAuthGateStatus('idle');
    expect(isWebAuthGateReady('https://example.com/auth/callback?code=abc')).toBe(true);
  });

  it('stays blocked after params are stripped if still processing', () => {
    vi.mocked(hasAuthCallbackParams).mockReturnValue(false);
    setWebAuthGateStatus('processing');
    markWebAuthLinkHandled();
    expect(isWebAuthGateReady('https://example.com/auth/callback')).toBe(false);
  });
});
