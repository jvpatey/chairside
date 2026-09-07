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

  const completeLocation = {
    is_active: true,
    address_line1: '1 Main St',
    city: 'Halifax',
    postal_code: 'B3H 1A1',
    software_used: ['Dentrix'],
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

  it('allows managers when owner setup is stamped and they have a clinic', () => {
    expect(
      isClinicMemberReadyToPost({
        isGroup: true,
        isOwner: false,
        clinicProfile: completeProfile as never,
        locations: [{ is_active: true }],
        assignedLocationIds: ['loc-1'],
      }),
    ).toBe(true);
  });

  it('blocks managers when owner has not finished setup', () => {
    mocks.isClinicProfileComplete.mockReturnValue(false);
    const incomplete = {
      ...completeProfile,
      setup_completed_at: null,
      phone: null,
      contact_name: null,
    };
    expect(
      isClinicMemberReadyToPost({
        isGroup: true,
        isOwner: false,
        clinicProfile: incomplete as never,
        locations: [completeLocation],
        assignedLocationIds: ['loc-1'],
      }),
    ).toBe(false);
    expect(
      getManagerAccessBlockReason({
        isGroup: true,
        isOwner: false,
        clinicProfile: incomplete as never,
        locations: [completeLocation],
        assignedLocationIds: ['loc-1'],
      }),
    ).toBe('owner_setup_incomplete');
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
