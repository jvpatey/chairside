import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => {
  type Account = 'individual' | 'group';
  const state = {
    orgAccountType: 'individual' as Account,
    existingLocationCount: 0,
    insertError: null as Error | null,
    calls: [] as string[],
  };

  function locationRows() {
    return Array.from({ length: state.existingLocationCount }, (_, index) => ({
      id: `loc-${index}`,
      organization_id: 'org-1',
      name: `Site ${index}`,
      address_line1: '1 Main St',
      is_primary: index === 0,
      is_active: true,
    }));
  }

  function makeBuilder(table: string) {
    let op: 'select' | 'insert' | 'update' | 'delete' = 'select';
    const chain: Record<string, unknown> = {};
    const pass = () => chain;

    function resolveSingle() {
      if (table === 'clinic_organizations') {
        return { data: { account_type: state.orgAccountType }, error: null };
      }
      if (table === 'clinic_locations' && op === 'insert') {
        if (state.insertError) return { data: null, error: state.insertError };
        return {
          data: {
            id: 'loc-new',
            organization_id: 'org-1',
            name: 'Downtown',
            is_primary: false,
            is_active: true,
          },
          error: null,
        };
      }
      return { data: null, error: null };
    }

    function resolveList() {
      if (table === 'clinic_locations' && op === 'select') {
        return { data: locationRows(), error: null };
      }
      return { data: null, error: null };
    }

    Object.assign(chain, {
      select: pass,
      eq: pass,
      neq: pass,
      order: pass,
      in: pass,
      insert: () => {
        op = 'insert';
        state.calls.push(`${table}.insert`);
        return chain;
      },
      update: (payload: { account_type?: Account }) => {
        op = 'update';
        if (table === 'clinic_organizations' && payload.account_type) {
          state.calls.push(`org.update:${payload.account_type}`);
          state.orgAccountType = payload.account_type;
        }
        return chain;
      },
      delete: () => {
        op = 'delete';
        return chain;
      },
      maybeSingle: async () => resolveSingle(),
      single: async () => resolveSingle(),
      then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
        Promise.resolve(resolveList()).then(onFulfilled, onRejected),
    });

    return chain;
  }

  const client = { from: (table: string) => makeBuilder(table) };

  return { state, client };
});

vi.mock('./client', () => ({
  getSupabaseClient: () => fake.client,
}));

import { createClinicLocation } from './clinicOrganization';

const input = {
  name: 'Downtown',
  address_line1: '1 Main St',
  city: 'Halifax',
  province: 'NS',
  postal_code: 'B3H1A1',
};

describe('createClinicLocation account promotion', () => {
  beforeEach(() => {
    fake.state.orgAccountType = 'individual';
    fake.state.existingLocationCount = 0;
    fake.state.insertError = null;
    fake.state.calls.length = 0;
  });

  it('does not change account type for the first clinic', async () => {
    await createClinicLocation('org-1', input);

    expect(fake.state.calls).toEqual(['clinic_locations.insert']);
    expect(fake.state.orgAccountType).toBe('individual');
  });

  it('promotes an individual account to group before inserting a second clinic', async () => {
    fake.state.existingLocationCount = 1;

    await createClinicLocation('org-1', input);

    expect(fake.state.calls).toEqual(['org.update:group', 'clinic_locations.insert']);
    expect(fake.state.orgAccountType).toBe('group');
  });

  it('leaves a group account alone when adding another clinic', async () => {
    fake.state.existingLocationCount = 2;
    fake.state.orgAccountType = 'group';

    await createClinicLocation('org-1', input);

    expect(fake.state.calls).toEqual(['clinic_locations.insert']);
  });

  it('rolls the promotion back when the insert is rejected', async () => {
    fake.state.existingLocationCount = 1;
    fake.state.insertError = new Error(
      'Location limit reached. Upgrade your plan to add more locations.',
    );

    await expect(createClinicLocation('org-1', input)).rejects.toThrow(
      'Location limit reached',
    );

    expect(fake.state.calls).toEqual([
      'org.update:group',
      'clinic_locations.insert',
      'org.update:individual',
    ]);
    expect(fake.state.orgAccountType).toBe('individual');
  });

  it('requires a location name', async () => {
    fake.state.existingLocationCount = 1;

    await expect(createClinicLocation('org-1', { ...input, name: '   ' })).rejects.toThrow(
      'Location name is required.',
    );
    expect(fake.state.calls).toEqual([]);
  });
});
