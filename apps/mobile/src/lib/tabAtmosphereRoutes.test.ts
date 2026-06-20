import { describe, expect, it } from 'vitest';

import { getActiveTabBarName } from './tabAtmosphereRoutes';

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
    expect(getActiveTabBarName('/(tabs)/fillins', 'worker')).toBe('fillins');
  });

  it('resolves role applicants to applications', () => {
    expect(getActiveTabBarName('/(clinic-tabs)/role-applicants/job-1', 'clinic')).toBe(
      'applications',
    );
  });
});
