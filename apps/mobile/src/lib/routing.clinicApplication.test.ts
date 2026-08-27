import { describe, expect, it, vi } from 'vitest';

import {
  getClinicApplicationRoute,
  getClinicApplicationsRoute,
  getClinicDiscoverClinicProfileRoute,
  getClinicDiscoverRoute,
  getClinicRoleApplicationsRoute,
  getWorkerClinicProfileRoute,
  navigateAfterClinicApplication,
  navigateAfterClinicDiscover,
  navigateAfterRoleApplicants,
} from './routing';

describe('getClinicDiscoverRoute', () => {
  it('includes tab and return target for mobile entry points', () => {
    expect(getClinicDiscoverRoute('roles', 'postings-tab')).toEqual({
      pathname: '/(clinic-tabs)/discover',
      params: { tab: 'roles', returnTo: 'postings-tab' },
    });
    expect(getClinicDiscoverRoute('fill-ins', 'fill-ins-tab')).toEqual({
      pathname: '/(clinic-tabs)/discover',
      params: { tab: 'fill-ins', returnTo: 'fill-ins-tab' },
    });
  });
});

describe('clinic profile routes', () => {
  it('puts the clinic id in the worker path so it is not dropped from job detail', () => {
    expect(getWorkerClinicProfileRoute('clinic-1')).toBe('/(tabs)/clinic/clinic-1');
    expect(
      getWorkerClinicProfileRoute('clinic-1', { returnTo: 'job-detail', jobId: 'job-1' }),
    ).toBe('/(tabs)/clinic/clinic-1?returnTo=job-detail&jobId=job-1');
  });

  it('puts the clinic id in the clinic-side path', () => {
    expect(getClinicDiscoverClinicProfileRoute('clinic-1', { fromJobId: 'job-1' })).toBe(
      '/(clinic-tabs)/clinic/clinic-1?fromJobId=job-1',
    );
    expect(getClinicDiscoverClinicProfileRoute('clinic-1', { fromShiftId: 'shift-1' })).toBe(
      '/(clinic-tabs)/clinic/clinic-1?fromShiftId=shift-1',
    );
  });
});

describe('navigateAfterClinicDiscover', () => {
  it('returns to postings or fill-ins tabs', () => {
    const router = { replace: vi.fn(), back: vi.fn(), canGoBack: vi.fn(() => false) };

    navigateAfterClinicDiscover(router, 'postings-tab');
    expect(router.replace).toHaveBeenCalledWith('/(clinic-tabs)/postings');

    router.replace.mockClear();
    navigateAfterClinicDiscover(router, 'fill-ins-tab');
    expect(router.replace).toHaveBeenCalledWith('/(clinic-tabs)/fill-ins');
  });
});

describe('getClinicApplicationRoute', () => {
  it('builds the clinic applicant detail route', () => {
    expect(getClinicApplicationRoute('app-123', 'applications-tab')).toEqual({
      pathname: '/(clinic-tabs)/application/[id]',
      params: {
        id: 'app-123',
        returnTo: 'applications-tab',
      },
    });
  });

  it('includes roleJobId when returning to a role applicant list', () => {
    expect(getClinicApplicationRoute('app-123', 'applications-tab', 'job-456')).toEqual({
      pathname: '/(clinic-tabs)/application/[id]',
      params: {
        id: 'app-123',
        returnTo: 'applications-tab',
        roleJobId: 'job-456',
      },
    });
  });

  it('includes selectJobId when restoring Applications split selection', () => {
    expect(
      getClinicApplicationRoute('app-123', 'applications-tab', undefined, 'job-456'),
    ).toEqual({
      pathname: '/(clinic-tabs)/application/[id]',
      params: {
        id: 'app-123',
        returnTo: 'applications-tab',
        selectJobId: 'job-456',
      },
    });
  });
});

describe('navigateAfterClinicApplication', () => {
  it('returns to Applications hub for applications-tab without roleJobId', () => {
    const router = { replace: vi.fn(), back: vi.fn(), canGoBack: vi.fn(() => true) };

    navigateAfterClinicApplication(router, 'applications-tab', undefined, 'job-456');

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(getClinicApplicationsRoute('job-456'));
  });

  it('returns to the role applicant list when roleJobId is present', () => {
    const router = { replace: vi.fn(), back: vi.fn(), canGoBack: vi.fn(() => true) };

    navigateAfterClinicApplication(router, 'applications-tab', 'job-456');

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(
      getClinicRoleApplicationsRoute('job-456', 'applications-tab'),
    );
  });

  it('returns to the applications tab when history and roleJobId are unavailable', () => {
    const router = { replace: vi.fn(), back: vi.fn(), canGoBack: vi.fn(() => false) };

    navigateAfterClinicApplication(router, 'applications-tab');

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/(clinic-tabs)/applications');
  });
});

describe('navigateAfterRoleApplicants', () => {
  it('prefers router.back when history is available', () => {
    const router = { replace: vi.fn(), back: vi.fn(), canGoBack: vi.fn(() => true) };

    navigateAfterRoleApplicants(router, 'postings-tab');

    expect(router.back).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('falls back to explicit return targets when history is unavailable', () => {
    const router = { replace: vi.fn(), back: vi.fn(), canGoBack: vi.fn(() => false) };

    navigateAfterRoleApplicants(router, 'postings-tab');

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/(clinic-tabs)/postings');
  });
});
