import type { RoleType } from '@chairside/config';
import { getSupabaseClient } from './client';
import { getErrorMessage, getFunctionsHttpStatus, resolveFunctionErrorMessage } from './errors';
import { AdminStatsForbiddenError } from './adminStats';
import type { EmploymentType, JobPostStatus, ShiftPostStatus, ShiftUrgency } from './posts';

export type SourcedListingKind = 'role' | 'fill_in';

export type SourcedListingShared = {
  id: string;
  kind: SourcedListingKind;
  roleType: RoleType | string;
  status: string;
  displayClinicName: string;
  displayCity: string;
  displayProvince: string;
  contactPhone: string | null;
  contactEmail: string | null;
  externalUrl: string | null;
  adminNotes: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SourcedRoleListing = SourcedListingShared & {
  kind: 'role';
  title: string;
  employmentType: EmploymentType | string;
  wageRange: string | null;
  schedule: string | null;
};

export type SourcedFillInListing = SourcedListingShared & {
  kind: 'fill_in';
  shiftDate: string;
  startTime: string;
  endTime: string;
  compensation: string | null;
  urgency: ShiftUrgency | string;
};

export type SourcedListing = SourcedRoleListing | SourcedFillInListing;

export type SourcedListingsPayload = {
  roles: SourcedRoleListing[];
  fillIns: SourcedFillInListing[];
};

export type CreateSourcedListingInput = {
  kind: SourcedListingKind;
  displayClinicName: string;
  displayCity: string;
  displayProvince: string;
  roleType: RoleType | string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  externalUrl?: string | null;
  adminNotes?: string | null;
  description?: string | null;
  title?: string;
  employmentType?: EmploymentType | string;
  wageRange?: string | null;
  schedule?: string | null;
  shiftDate?: string;
  startTime?: string;
  endTime?: string;
  compensation?: string | null;
  urgency?: ShiftUrgency | string;
};

export type UpdateSourcedListingInput = Partial<
  Omit<CreateSourcedListingInput, 'kind'>
> & {
  kind: SourcedListingKind;
  id: string;
};

async function invokeAdminSourced<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('admin-sourced-listings', { body });

  if (getFunctionsHttpStatus(error) === 403) {
    throw new AdminStatsForbiddenError(
      (await resolveFunctionErrorMessage(error, data)) ?? 'Forbidden',
    );
  }

  if (error) {
    throw new Error(
      (await resolveFunctionErrorMessage(error, data)) ??
        getErrorMessage(error, 'Could not complete sourced listing request.'),
    );
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    const message = String(data.error);
    if (message.toLowerCase().includes('forbidden')) {
      throw new AdminStatsForbiddenError(message);
    }
    throw new Error(message);
  }

  return data as T;
}

export async function listAdminSourcedListings(
  kind?: SourcedListingKind | 'all',
): Promise<SourcedListingsPayload> {
  return invokeAdminSourced<SourcedListingsPayload>({
    action: 'list',
    kind: kind ?? 'all',
  });
}

export async function createAdminSourcedListing(
  input: CreateSourcedListingInput,
): Promise<SourcedListing> {
  const result = await invokeAdminSourced<{ listing: SourcedListing }>({
    action: 'create',
    ...input,
  });
  return result.listing;
}

export async function updateAdminSourcedListing(
  input: UpdateSourcedListingInput,
): Promise<SourcedListing> {
  const result = await invokeAdminSourced<{ listing: SourcedListing }>({
    action: 'update',
    ...input,
  });
  return result.listing;
}

export async function setAdminSourcedListingStatus(params: {
  kind: SourcedListingKind;
  id: string;
  status: JobPostStatus | ShiftPostStatus | string;
}): Promise<SourcedListing> {
  const result = await invokeAdminSourced<{ listing: SourcedListing }>({
    action: 'setStatus',
    kind: params.kind,
    id: params.id,
    status: params.status,
  });
  return result.listing;
}

export async function deleteAdminSourcedListing(params: {
  kind: SourcedListingKind;
  id: string;
}): Promise<void> {
  await invokeAdminSourced<{ ok: boolean }>({
    action: 'delete',
    kind: params.kind,
    id: params.id,
  });
}
