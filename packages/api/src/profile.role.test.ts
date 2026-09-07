import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();
const updateSingle = vi.fn();
const insertSingle = vi.fn();
const updateEq = vi.fn();
const update = vi.fn();
const insert = vi.fn();
const from = vi.fn();

vi.mock('./client', () => ({
  getSupabaseClient: () => ({
    from,
  }),
}));

import { setProfileRole } from './profile';

describe('setProfileRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle,
        }),
      }),
      update: (payload: unknown) => {
        update(payload);
        return {
          eq: (column: string, value: string) => {
            updateEq(column, value);
            return {
              select: () => ({
                single: updateSingle,
              }),
            };
          },
        };
      },
      insert: (payload: unknown) => {
        insert(payload);
        return {
          select: () => ({
            single: insertSingle,
          }),
        };
      },
    }));
  });

  it('updates when the profile row already exists', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'user-1', role: null },
      error: null,
    });
    updateSingle.mockResolvedValue({
      data: { id: 'user-1', role: 'worker' },
      error: null,
    });

    await expect(setProfileRole('user-1', 'worker')).resolves.toEqual({
      id: 'user-1',
      role: 'worker',
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'worker',
      }),
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it('inserts only when the profile row is missing', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    insertSingle.mockResolvedValue({
      data: { id: 'user-1', role: 'clinic' },
      error: null,
    });

    await expect(setProfileRole('user-1', 'clinic')).resolves.toEqual({
      id: 'user-1',
      role: 'clinic',
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        role: 'clinic',
      }),
    );
    expect(update).not.toHaveBeenCalled();
  });
});
