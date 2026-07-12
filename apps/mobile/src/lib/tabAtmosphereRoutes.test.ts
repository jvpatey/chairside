import { describe, expect, it } from 'vitest';

import { getActiveTabBarName, getTabAccentForName, isTabRootPath } from './tabAtmosphereRoutes';

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
    expect(getActiveTabBarName('/(clinic-tabs)/discover', 'clinic')).toBe('discover');
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

describe('isTabRootPath', () => {
  it('keeps discover selected on nested discover detail routes', () => {
    expect(
      getActiveTabBarName('/(clinic-tabs)/discover/job/job-1', 'clinic'),
    ).toBe('discover');
    expect(
      getActiveTabBarName('/(clinic-tabs)/discover/shift/shift-1', 'clinic'),
    ).toBe('discover');
  });

  it('returns true on main tab list screens', () => {
    expect(isTabRootPath('/(clinic-tabs)/applications', 'applications', 'clinic')).toBe(true);
    expect(isTabRootPath('/(clinic-tabs)/discover', 'discover', 'clinic')).toBe(true);
    expect(isTabRootPath('/(tabs)/browse', 'browse', 'worker')).toBe(true);
    expect(isTabRootPath('/(clinic-tabs)', 'index', 'clinic')).toBe(true);
  });

  it('returns false on nested stack routes', () => {
    expect(isTabRootPath('/(clinic-tabs)/role-applicants/job-1', 'applications', 'clinic')).toBe(
      false,
    );
    expect(isTabRootPath('/(tabs)/application/app-1', 'applications', 'worker')).toBe(false);
    expect(isTabRootPath('/(clinic-tabs)/job/job-1', 'postings', 'clinic')).toBe(false);
  });

  it('returns false on worker messages sub-screens', () => {
    expect(isTabRootPath('/(tabs)/messages/clinics', 'messages', 'worker')).toBe(false);
    expect(isTabRootPath('/(tabs)/messages', 'messages', 'worker')).toBe(true);
  });
});

describe('getTabAccentForName', () => {
  it('uses primary accent for calendar and secondary for fill-ins', () => {
    expect(getTabAccentForName('calendar')).toBe('primary');
    expect(getTabAccentForName('fillins')).toBe('secondary');
    expect(getTabAccentForName('fill-ins')).toBe('secondary');
  });
});
