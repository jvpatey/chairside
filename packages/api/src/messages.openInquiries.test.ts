import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();

vi.mock('./client', () => ({
  getSupabaseClient: () => ({ rpc }),
}));

import {
  getOrCreateGeneralConversation,
  getOrCreateGeneralConversationAsClinic,
  listMessageableClinicsForWorker,
} from './messages';

describe('open inquiry message RPCs', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it('lists messageable clinics via live-plan RPC', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          id: 'c1',
          clinic_name: 'Harbour Dental',
          city: 'Halifax',
          province: 'NS',
          specialty: 'general',
          description: null,
          logo_storage_path: null,
          existing_conversation_id: 'conv-1',
        },
      ],
      error: null,
    });

    const clinics = await listMessageableClinicsForWorker('worker-1');

    expect(rpc).toHaveBeenCalledWith('list_messageable_clinics_for_worker');
    expect(clinics[0]?.clinic_name).toBe('Harbour Dental');
    expect(clinics[0]?.existing_conversation_id).toBe('conv-1');
  });

  it('starts a worker-initiated open inquiry', async () => {
    rpc.mockResolvedValue({ data: 'conv-2', error: null });

    await expect(getOrCreateGeneralConversation('clinic-1')).resolves.toBe('conv-2');
    expect(rpc).toHaveBeenCalledWith('get_or_create_general_conversation', {
      p_clinic_id: 'clinic-1',
    });
  });

  it('starts a clinic-initiated open inquiry', async () => {
    rpc.mockResolvedValue({ data: 'conv-3', error: null });

    await expect(getOrCreateGeneralConversationAsClinic('worker-1')).resolves.toBe('conv-3');
    expect(rpc).toHaveBeenCalledWith('get_or_create_general_conversation_as_clinic', {
      p_worker_id: 'worker-1',
    });
  });

  it('denies clinic start without paid plan', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Open inquiries require a Pro plan.' },
    });

    await expect(getOrCreateGeneralConversationAsClinic('worker-1')).rejects.toMatchObject({
      message: 'Open inquiries require a Pro plan.',
    });
  });
});
