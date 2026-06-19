import { describe, expect, it, vi } from 'vitest';

import {
  getClinicApplicationRoute,
  getClinicRoleApplicationsRoute,
  navigateAfterClinicApplication,
  navigateAfterRoleApplicants,
} from './routing';

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
});

describe('navigateAfterClinicApplication', () => {
  it('returns to the role applicant list when roleJobId is present', () => {
    const router = { replace: vi.fn(), back: vi.fn(), canGoBack: vi.fn(() => true) };

    navigateAfterClinicApplication(router, 'applications-tab', 'job-456');

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(
      getClinicRoleApplicationsRoute('job-456', 'applications-tab'),
    );
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
