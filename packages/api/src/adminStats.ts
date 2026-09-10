import { getSupabaseClient } from './client';
import { getErrorMessage, getFunctionsHttpStatus, resolveFunctionErrorMessage } from './errors';

export type AdminStatsClinicRow = {
  id: string;
  clinicName: string;
  accountType: 'individual' | 'group' | string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  signedUpAt: string | null;
  lastSignInAt: string | null;
};

export type AdminStatsProfessionalRow = {
  id: string;
  name: string;
  email: string | null;
  roles: string[];
  signedUpAt: string | null;
  lastSignInAt: string | null;
};

export type AdminStatsPayload = {
  generatedAt: string;
  kpis: {
    professionals: number;
    clinics: number;
    openRoles: number;
    filledRoles: number;
    liveFillIns: number;
    filledFillIns: number;
    signups7d: number;
    signups30d: number;
  };
  professionalsByRole: Array<{ role: string; count: number }>;
  planMix: Array<{ plan: string; count: number }>;
  statusMix: Array<{ status: string; count: number }>;
  clinics: AdminStatsClinicRow[];
  professionals: AdminStatsProfessionalRow[];
};

export class AdminStatsForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'AdminStatsForbiddenError';
  }
}

export async function fetchAdminStats(): Promise<AdminStatsPayload> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('admin-stats');

  const status = getFunctionsHttpStatus(error);
  if (status === 403) {
    throw new AdminStatsForbiddenError(
      (await resolveFunctionErrorMessage(error, data)) ?? 'Forbidden',
    );
  }

  if (error) {
    throw new Error(
      (await resolveFunctionErrorMessage(error, data)) ??
        getErrorMessage(error, 'Could not load admin stats.'),
    );
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    const message = String(data.error);
    if (message.toLowerCase().includes('forbidden')) {
      throw new AdminStatsForbiddenError(message);
    }
    throw new Error(message);
  }

  return data as AdminStatsPayload;
}
