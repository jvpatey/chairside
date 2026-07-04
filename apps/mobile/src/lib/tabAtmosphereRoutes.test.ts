import { describe, expect, it } from 'vitest';

import { getActiveTabBarName, getTabAccentForName } from './tabAtmosphereRoutes';

describe('getActiveTabBarName', () => {
  it('keeps applications selected on worker application detail', () => {
    expect(
      getActiveTabBarName('/(tabs)/application/app-1', 'worker', 'applications-tab'),
    ).toBe('applications');
  });

  it('keeps applications selected on clinic application detail', () => {
    expect(
      getActiveTabBarName('/(clinic-tabs)/application/app-1', 'clinic', 'applications-tab'),
    ).toBe('applications');
  });

  it('highlights dashboard when opened from dashboard applications', () => {
    expect(
      getActiveTabBarName('/(tabs)/application/app-1', 'worker', 'dashboard-applications'),
    ).toBe('index');
  });

  it('resolves main tabs from pathname', () => {
    expect(getActiveTabBarName('/(clinic-tabs)/applications', 'clinic')).toBe('applications');
    expect(getActiveTabBarName('/(clinic-tabs)/calendar', 'clinic')).toBe('calendar');
    expect(getActiveTabBarName('/(tabs)/fillins', 'worker')).toBe('fillins');
    expect(getActiveTabBarName('/(tabs)/calendar', 'worker')).toBe('calendar');
  });

  it('resolves role applicants to applications', () => {
    expect(getActiveTabBarName('/(clinic-tabs)/role-applicants/job-1', 'clinic')).toBe(
      'applications',
    );
  });

  it('keeps calendar selected when opened from calendar tab', () => {
    expect(
      getActiveTabBarName('/(tabs)/application/app-1', 'worker', 'calendar-tab'),
    ).toBe('calendar');
    expect(
      getActiveTabBarName('/(clinic-tabs)/application/app-1', 'clinic', 'calendar-tab'),
    ).toBe('calendar');
  });
});

describe('getTabAccentForName', () => {
  it('uses primary accent for calendar and secondary for fill-ins', () => {
    expect(getTabAccentForName('calendar')).toBe('primary');
    expect(getTabAccentForName('fillins')).toBe('secondary');
    expect(getTabAccentForName('fill-ins')).toBe('secondary');
  });
});
