import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();

vi.mock('./client', () => ({
  getSupabaseClient: () => ({ rpc }),
}));

import { listOpenInquiryWorkersForClinic } from './openInquiries';

describe('listOpenInquiryWorkersForClinic', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it('maps opted-in workers and passes role filter', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          worker_id: 'w1',
          display_name: 'Ada',
          role_types: ['hygienist'],
          city: 'Halifax',
          years_of_experience: 4,
          bio: 'Loves perio.',
          photo_storage_path: 'photos/w1.jpg',
          existing_conversation_id: null,
        },
      ],
      error: null,
    });

    const rows = await listOpenInquiryWorkersForClinic({ roleType: 'hygienist' });

    expect(rpc).toHaveBeenCalledWith('list_open_inquiry_workers_for_clinic', {
      p_role_type: 'hygienist',
    });
    expect(rows).toEqual([
      {
        workerId: 'w1',
        displayName: 'Ada',
        roleTypes: ['hygienist'],
        city: 'Halifax',
        yearsOfExperience: 4,
        bio: 'Loves perio.',
        photoStoragePath: 'photos/w1.jpg',
        existingConversationId: null,
      },
    ]);
  });

  it('surfaces paid-plan denials', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Open inquiries require a Pro plan.' },
    });

    await expect(listOpenInquiryWorkersForClinic()).rejects.toThrow(
      'Open inquiries require a Pro plan.',
    );
  });
});
