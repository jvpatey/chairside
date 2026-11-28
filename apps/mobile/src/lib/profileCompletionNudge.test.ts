import { describe, expect, it } from 'vitest';

import { getClinicProfileNudge, getWorkerProfileNudge } from './profileCompletionNudge';

describe('getClinicProfileNudge', () => {
  it('returns nothing when the profile is complete', () => {
    expect(getClinicProfileNudge([])).toBeNull();
  });

  it('leads with the phone because cover-request texts depend on it', () => {
    const nudge = getClinicProfileNudge(['Phone', 'Postal code']);
    expect(nudge?.focus).toBe('phone');
    expect(nudge?.title).toBe('Add your clinic phone');
    expect(nudge?.href).toBe('/(onboarding)/capture-clinic-phone');
  });

  it('asks for the address when only the address is missing', () => {
    const nudge = getClinicProfileNudge(['Street address', 'City', 'Postal code']);
    expect(nudge?.focus).toBe('details');
    expect(nudge?.message).toBe('Add your address to start posting.');
    expect(nudge?.href).toBe('/(onboarding)/capture-clinic-address');
  });

  it('lists name and address together', () => {
    const nudge = getClinicProfileNudge(['Clinic name', 'City']);
    expect(nudge?.message).toBe('Add your clinic name and address to start posting.');
  });
});

describe('getWorkerProfileNudge', () => {
  it('returns nothing when the profile is complete', () => {
    expect(getWorkerProfileNudge([])).toBeNull();
  });

  it('leads with the mobile number because fill-ins are sent by text', () => {
    const nudge = getWorkerProfileNudge(['Mobile phone', 'City']);
    expect(nudge?.focus).toBe('phone');
    expect(nudge?.title).toBe('Add your mobile number');
    expect(nudge?.href).toBe('/(onboarding)/capture-phone');
  });

  it('asks for role and city when the phone is already saved', () => {
    const nudge = getWorkerProfileNudge(['Role type', 'City']);
    expect(nudge?.focus).toBe('details');
    expect(nudge?.message).toBe('Add your role and city so we can show matching openings.');
    expect(nudge?.href).toBe('/(onboarding)/capture-location');
  });
});
