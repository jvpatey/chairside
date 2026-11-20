import { describe, expect, it } from 'vitest';

import {
  getActiveTabBarName,
  getFocusedTabSceneName,
  getTabAccentForName,
  isTabRootPath,
  isWebTabSceneFocused,
} from './tabAtmosphereRoutes';

describe('getFocusedTabSceneName', () => {
  it('maps fill-in availability to its own scene, not fillins', () => {
    expect(getFocusedTabSceneName('/(tabs)/fill-in-availability', 'worker')).toBe(
      'fill-in-availability',
    );
    expect(getFocusedTabSceneName('/fill-in-availability', 'worker')).toBe(
      'fill-in-availability',
    );
  });

  it('maps shift and job details to dynamic scene names', () => {
    expect(getFocusedTabSceneName('/shift/abc-123', 'worker')).toBe('shift/[id]');
    expect(getFocusedTabSceneName('/(tabs)/shift/abc-123', 'worker')).toBe('shift/[id]');
    expect(getFocusedTabSceneName('/job/abc-123', 'worker')).toBe('job/[id]');
  });

  it('maps main tabs and home', () => {
    expect(getFocusedTabSceneName('/(tabs)/fillins', 'worker')).toBe('fillins');
    expect(getFocusedTabSceneName('/(tabs)', 'worker')).toBe('index');
    expect(getFocusedTabSceneName('/(tabs)/browse', 'worker')).toBe('browse');
  });
});

describe('isWebTabSceneFocused', () => {
  it('focuses shift/[id] for fill-in detail URLs, not fillins or index', () => {
    const pathname = '/shift/893d634e-2a12-4b82-9d8d-ac0e7e0aa777';

    expect(isWebTabSceneFocused('shift/[id]', pathname, 'worker')).toBe(true);
    expect(isWebTabSceneFocused('fillins', pathname, 'worker')).toBe(false);
    expect(isWebTabSceneFocused('index', pathname, 'worker')).toBe(false);
    expect(isWebTabSceneFocused('fill-in-availability', pathname, 'worker')).toBe(
      false,
    );
  });

  it('focuses fill-in-availability for its own route', () => {
    const pathname = '/fill-in-availability';

    expect(isWebTabSceneFocused('fill-in-availability', pathname, 'worker')).toBe(
      true,
    );
    expect(isWebTabSceneFocused('fillins', pathname, 'worker')).toBe(false);
    expect(isWebTabSceneFocused('index', pathname, 'worker')).toBe(false);
  });

  it('focuses fillins on the hub, not shift detail', () => {
    expect(isWebTabSceneFocused('fillins', '/fillins', 'worker')).toBe(true);
    expect(isWebTabSceneFocused('shift/[id]', '/fillins', 'worker')).toBe(false);
  });
});

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

  it('keeps Home selected on profile hub routes', () => {
    expect(getActiveTabBarName('/(tabs)/profile', 'worker')).toBe('index');
    expect(getActiveTabBarName('/(tabs)/profile/account', 'worker')).toBe('index');
    expect(getActiveTabBarName('/(clinic-tabs)/profile', 'clinic')).toBe('index');
    expect(getActiveTabBarName('/(clinic-tabs)/profile/billing', 'clinic')).toBe('index');
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

  it('keeps messages selected on open inquiry candidates', () => {
    expect(getActiveTabBarName('/(clinic-tabs)/open-inquiry-candidates', 'clinic')).toBe(
      'messages',
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
  it('maps workflow tabs to their lane accents', () => {
    expect(getTabAccentForName('calendar')).toBe('primary');
    expect(getTabAccentForName('browse')).toBe('primary');
    expect(getTabAccentForName('applications')).toBe('tertiary');
    expect(getTabAccentForName('fillins')).toBe('secondary');
    expect(getTabAccentForName('fill-ins')).toBe('secondary');
  });
});
