import { describe, expect, it } from 'vitest';

import { getClinicDashboardHeroNaming } from './clinicDashboardHeroNaming';

const locations = [
  { id: 'loc-1', name: 'Downtown', city: 'Halifax', province: 'NS' },
  { id: 'loc-2', name: 'Bedford', city: 'Bedford', province: 'NS' },
];

describe('getClinicDashboardHeroNaming', () => {
  it('keeps the group name as the title and the subtitle on the selected clinic', () => {
    const first = getClinicDashboardHeroNaming({
      isGroup: true,
      isProfileComplete: true,
      groupName: 'Dental Group Test',
      memberDisplayName: 'Jeff Patey',
      memberRoleLabel: 'Owner',
      locationScope: 'loc-1',
      accessibleLocations: locations,
    });

    expect(first.greetingName).toBe('Jeff');
    expect(first.displayName).toBe('Dental Group Test');
    expect(first.subtitle).toBe('Halifax, NS');
    expect(first.identityLine).toBe('Owner');

    const second = getClinicDashboardHeroNaming({
      isGroup: true,
      isProfileComplete: true,
      groupName: 'Dental Group Test',
      memberDisplayName: 'Jeff Patey',
      locationScope: 'loc-2',
      accessibleLocations: locations,
    });

    expect(second.displayName).toBe('Dental Group Test');
    expect(second.subtitle).toBe('Bedford, NS');
  });

  it('falls back to the first clinic when the scope is not an accessible location', () => {
    const naming = getClinicDashboardHeroNaming({
      isGroup: true,
      isProfileComplete: true,
      groupName: 'Dental Group Test',
      locationScope: 'all',
      accessibleLocations: locations,
    });

    expect(naming.displayName).toBe('Dental Group Test');
    expect(naming.subtitle).toBe('Halifax, NS');
  });

  it('still greets the member while group setup is incomplete', () => {
    const naming = getClinicDashboardHeroNaming({
      isGroup: true,
      isProfileComplete: false,
      groupName: 'Dental Group Test',
      memberDisplayName: 'Jeff',
      locationScope: 'loc-1',
      accessibleLocations: locations,
    });

    expect(naming.greetingName).toBe('Jeff');
    expect(naming.displayName).toBe('Dental Group Test');
    expect(naming.identityLine).toBeUndefined();
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
