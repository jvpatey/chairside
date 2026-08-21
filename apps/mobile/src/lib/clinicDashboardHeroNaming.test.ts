import { describe, expect, it } from 'vitest';

import { getClinicDashboardHeroNaming } from './clinicDashboardHeroNaming';

const locations = [
  { id: 'loc-1', name: 'Downtown', city: 'Halifax', province: 'NS' },
  { id: 'loc-2', name: 'Bedford', city: 'Bedford', province: 'NS' },
];

describe('getClinicDashboardHeroNaming', () => {
  it('keeps group greetings personal and titles scope-aware', () => {
    const all = getClinicDashboardHeroNaming({
      isGroup: true,
      isProfileComplete: true,
      groupName: 'Dental Group Test',
      memberDisplayName: 'Jeff Patey',
      memberRoleLabel: 'Owner',
      locationScope: 'all',
      accessibleLocations: locations,
    });

    expect(all.greetingName).toBe('Jeff');
    expect(all.displayName).toBe('Dental Group Test');
    expect(all.subtitle).toBe('2 locations');
    expect(all.identityLine).toBe('Owner');

    const scoped = getClinicDashboardHeroNaming({
      isGroup: true,
      isProfileComplete: true,
      groupName: 'Dental Group Test',
      memberDisplayName: 'Jeff Patey',
      memberRoleLabel: 'Owner',
      locationScope: 'loc-1',
      accessibleLocations: locations,
    });

    expect(scoped.greetingName).toBe('Jeff');
    expect(scoped.displayName).toBe('Downtown');
    expect(scoped.subtitle).toBe('Halifax, NS');
  });

  it('still greets the member while group setup is incomplete', () => {
    const naming = getClinicDashboardHeroNaming({
      isGroup: true,
      isProfileComplete: false,
      groupName: 'Dental Group Test',
      memberDisplayName: 'Jeff',
      locationScope: 'all',
      accessibleLocations: locations,
    });

    expect(naming.greetingName).toBe('Jeff');
    expect(naming.displayName).toBe('Dental Group Test');
    expect(naming.subtitle).toBe('2 locations');
  });

  it('uses contact first name for individual clinics when complete', () => {
    const naming = getClinicDashboardHeroNaming({
      isGroup: false,
      isProfileComplete: true,
      clinicName: 'Harbour Dental',
      contactName: 'Sarah Lee',
      locationScope: 'all',
      accessibleLocations: [],
      clinicCity: 'Halifax',
      clinicProvince: 'NS',
    });

    expect(naming.greetingName).toBe('Sarah');
    expect(naming.displayName).toBe('Harbour Dental');
    expect(naming.subtitle).toBe('Halifax, NS');
  });
});
