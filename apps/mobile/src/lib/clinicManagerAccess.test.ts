import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isClinicProfileComplete: vi.fn(() => false),
}));

vi.mock('@chairside/api', () => ({
  isClinicProfileComplete: mocks.isClinicProfileComplete,
}));

import {
  getManagerAccessBannerCopy,
  getManagerAccessBlockReason,
  getOwnerUnassignedManagersCopy,
  isClinicMemberReadyToPost,
} from '@/lib/clinicManagerAccess';

describe('clinicManagerAccess', () => {
  const completeProfile = {
    account_type: 'group',
    clinic_name: 'Dental Group 1',
    contact_name: 'Owner',
    phone: '555-0100',
    setup_completed_at: '2026-01-01T00:00:00.000Z',
  };

  it('blocks managers with no assigned clinics', () => {
    expect(
      isClinicMemberReadyToPost({
        isGroup: true,
        isOwner: false,
        clinicProfile: completeProfile as never,
        locations: [],
        assignedLocationIds: [],
      }),
    ).toBe(false);
    expect(
      getManagerAccessBlockReason({
        isGroup: true,
        isOwner: false,
        clinicProfile: completeProfile as never,
        locations: [],
        assignedLocationIds: [],
      }),
    ).toBe('no_clinic_assigned');
  });

  it('allows managers with assigned clinics even if location fields are incomplete', () => {
    mocks.isClinicProfileComplete.mockReturnValue(false);
    expect(
      isClinicMemberReadyToPost({
        isGroup: true,
        isOwner: false,
        clinicProfile: {
          ...completeProfile,
          setup_completed_at: null,
        } as never,
        locations: [{ is_active: true }],
        assignedLocationIds: ['loc-1'],
      }),
    ).toBe(true);
  });

  it('allows managers when they can see an active location', () => {
    expect(
      isClinicMemberReadyToPost({
        isGroup: true,
        isOwner: false,
        clinicProfile: completeProfile as never,
        locations: [{ is_active: true }],
        assignedLocationIds: [],
      }),
    ).toBe(true);
  });

  it('keeps owners on field completeness', () => {
    mocks.isClinicProfileComplete.mockReturnValue(false);
    expect(
      isClinicMemberReadyToPost({
        isGroup: true,
        isOwner: true,
        clinicProfile: completeProfile as never,
        locations: [],
        assignedLocationIds: [],
      }),
    ).toBe(false);
    expect(mocks.isClinicProfileComplete).toHaveBeenCalled();
  });

  it('returns clear banner copy', () => {
    expect(getManagerAccessBannerCopy('no_clinic_assigned').title).toBe(
      'Waiting for clinic access',
    );
    expect(getOwnerUnassignedManagersCopy(1).message).toContain('Assign them a location');
    expect(getOwnerUnassignedManagersCopy(2).message).toContain('2 managers');
  });
});
