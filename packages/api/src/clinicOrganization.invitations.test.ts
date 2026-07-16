import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();

vi.mock('./client', () => ({
  getSupabaseClient: () => ({ rpc }),
}));

import {
  acceptClinicManagerInvitation,
  createClinicManagerInvitation,
  previewClinicManagerInvitation,
  resendClinicManagerInvitation,
  revokeClinicManagerInvitation,
} from './clinicOrganization';

describe('clinic manager invitation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes email and location ids when creating an invitation', async () => {
    const invite = {
      id: 'inv-1',
      email: 'manager@clinic.com',
      token: 'tok',
      location_ids: ['loc-1'],
      status: 'pending',
    };
    rpc.mockResolvedValue({ data: invite, error: null });

    const result = await createClinicManagerInvitation({
      organizationId: 'org-1',
      email: '  Manager@Clinic.com ',
      displayName: '  Sarah  ',
      title: '  Office Manager  ',
      locationIds: ['loc-1'],
    });

    expect(rpc).toHaveBeenCalledWith('create_clinic_manager_invitation', {
      p_organization_id: 'org-1',
      p_email: 'manager@clinic.com',
      p_display_name: 'Sarah',
      p_title: 'Office Manager',
      p_location_ids: ['loc-1'],
    });
    expect(result).toEqual(invite);
  });

  it('defaults missing location ids to an empty assignment list', async () => {
    rpc.mockResolvedValue({ data: { id: 'inv-2' }, error: null });

    await createClinicManagerInvitation({
      organizationId: 'org-1',
      email: 'a@b.com',
    });

    expect(rpc).toHaveBeenCalledWith(
      'create_clinic_manager_invitation',
      expect.objectContaining({ p_location_ids: [] }),
    );
  });

  it('maps preview RPC payloads and preserves non-token fields only', async () => {
    rpc.mockResolvedValue({
      data: {
        status: 'pending',
        email: 'manager@clinic.com',
        organization_name: 'Northside Group',
        inviter_name: 'Owner',
        location_names: ['Downtown'],
        expires_at: '2026-07-21T00:00:00.000Z',
      },
      error: null,
    });

    const preview = await previewClinicManagerInvitation('  secret-token  ');

    expect(rpc).toHaveBeenCalledWith('preview_clinic_manager_invitation', {
      p_token: 'secret-token',
    });
    expect(preview).toEqual({
      status: 'pending',
      email: 'manager@clinic.com',
      organization_name: 'Northside Group',
      inviter_name: 'Owner',
      location_names: ['Downtown'],
      expires_at: '2026-07-21T00:00:00.000Z',
    });
    expect(preview).not.toHaveProperty('token');
  });

  it('surfaces accept mismatch / expiry / revoke / one-time errors from RPC', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Signed-in email does not match this invitation' },
    });
    await expect(acceptClinicManagerInvitation('tok')).rejects.toThrow(
      'Signed-in email does not match this invitation',
    );

    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Invitation has expired' },
    });
    await expect(acceptClinicManagerInvitation('tok')).rejects.toThrow('Invitation has expired');

    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Invitation is no longer pending' },
    });
    await expect(acceptClinicManagerInvitation('tok')).rejects.toThrow(
      'Invitation is no longer pending',
    );
  });

  it('calls resend and revoke RPCs', async () => {
    rpc.mockResolvedValueOnce({ data: { id: 'inv-new', token: 'fresh' }, error: null });
    rpc.mockResolvedValueOnce({ data: null, error: null });

    await expect(resendClinicManagerInvitation('inv-old')).resolves.toEqual({
      id: 'inv-new',
      token: 'fresh',
    });
    expect(rpc).toHaveBeenCalledWith('resend_clinic_manager_invitation', {
      p_invitation_id: 'inv-old',
    });

    await revokeClinicManagerInvitation('inv-old');
    expect(rpc).toHaveBeenCalledWith('revoke_clinic_manager_invitation', {
      p_invitation_id: 'inv-old',
    });
  });
});
