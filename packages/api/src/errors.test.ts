import { describe, expect, it } from 'vitest';

import { getFunctionsHttpStatus, resolveFunctionErrorMessage } from './errors';

describe('getFunctionsHttpStatus', () => {
  it('reads status from a FunctionsHttpError-shaped object', () => {
    expect(getFunctionsHttpStatus({ context: { status: 401 } })).toBe(401);
    expect(getFunctionsHttpStatus({ context: { status: 500 } })).toBe(500);
  });

  it('returns null when status is missing', () => {
    expect(getFunctionsHttpStatus(new Error('Edge Function returned a non-2xx status code'))).toBe(
      null,
    );
    expect(getFunctionsHttpStatus({ context: {} })).toBe(null);
  });
});

describe('resolveFunctionErrorMessage', () => {
  it('prefers a payload error string', async () => {
    await expect(
      resolveFunctionErrorMessage(new Error('Edge Function returned a non-2xx status code'), {
        error: 'Invalid or expired session',
      }),
    ).resolves.toBe('Invalid or expired session');
  });

  it('reads JSON from a Response-like context', async () => {
    await expect(
      resolveFunctionErrorMessage(
        {
          context: {
            json: async () => ({ error: 'Missing authorization' }),
          },
        },
        null,
      ),
    ).resolves.toBe('Missing authorization');
  });

  it('returns null when nothing useful is present', async () => {
    await expect(
      resolveFunctionErrorMessage(new Error('Edge Function returned a non-2xx status code'), null),
    ).resolves.toBe(null);
  });
});
