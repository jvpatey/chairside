import { getSupabaseClient } from './client';
import type {
  ClinicAccountType,
  ClinicInvitation,
  ClinicInvitationPreview,
  ClinicLocation,
  ClinicLocationInput,
  ClinicMembership,
  ClinicOrganization,
  ClinicWorkspace,
} from './clinicOrganizationTypes';

export type {
  ClinicAccountType,
  ClinicInvitation,
  ClinicInvitationPreview,
  ClinicInvitationPreviewStatus,
  ClinicInvitationStatus,
  ClinicLocation,
  ClinicLocationInput,
  ClinicMembership,
  ClinicMembershipRole,
  ClinicMembershipStatus,
  ClinicOrganization,
  ClinicWorkspace,
} from './clinicOrganizationTypes';
export { filterLocationsForMembership, formatPosterAttribution } from './clinicOrganizationUtils';

export async function getClinicOrganizationIdForUser(userId?: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_clinic_organization_id_for_user', {
    p_user_id: userId ?? undefined,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function getClinicMembershipForUser(
  userId: string,
  organizationId?: string,
): Promise<ClinicMembership | null> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('clinic_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const membership = data as ClinicMembership;
  if (membership.role === 'owner') {
    return { ...membership, location_ids: [] };
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from('clinic_member_location_assignments')
    .select('location_id')
    .eq('membership_id', membership.id);

  if (assignmentError) throw assignmentError;

  return {
    ...membership,
    location_ids: (assignments ?? []).map((row) => row.location_id as string),
  };
}

export async function getClinicOrganization(
  organizationId: string,
): Promise<ClinicOrganization | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_organizations')
    .select('*')
    .eq('id', organizationId)
    .maybeSingle();

  if (error) throw error;
  return data as ClinicOrganization | null;
}

export async function listClinicLocations(
  organizationId: string,
  options?: { activeOnly?: boolean },
): Promise<ClinicLocation[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('clinic_locations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true });

  if (options?.activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ClinicLocation[];
}

export async function getClinicWorkspace(userId: string): Promise<ClinicWorkspace | null> {
  const organizationId = await getClinicOrganizationIdForUser(userId);
  if (!organizationId) return null;

  const [organization, membership, locations] = await Promise.all([
    getClinicOrganization(organizationId),
    getClinicMembershipForUser(userId, organizationId),
    listClinicLocations(organizationId),
  ]);

  if (!organization || !membership) return null;

  const isOwner = membership.role === 'owner';
  const accessibleLocationIds: string[] | 'all' = isOwner
    ? 'all'
    : (membership.location_ids ?? []);

  return {
    organization,
    membership,
    locations,
    accessibleLocationIds,
    isOwner,
    isGroup: organization.account_type === 'group',
  };
}

export async function setClinicAccountType(
  organizationId: string,
  accountType: ClinicAccountType,
  name?: string,
): Promise<ClinicOrganization> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const providedName = name?.trim() || '';
  // Keep internal org stubs unlabeled until the user enters a real name on Basics.
  const PLACEHOLDER_NAMES = new Set(['clinic', 'owner', 'primary location']);

  const { data: organization, error } = await supabase
    .from('clinic_organizations')
    .upsert(
      {
        id: organizationId,
        account_type: accountType,
        name: providedName,
        updated_at: now,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();

  if (error) throw error;

  // Ensure owner membership exists even if the insert trigger did not run yet.
  const { error: membershipError } = await supabase.from('clinic_memberships').upsert(
    {
      organization_id: organizationId,
      user_id: organizationId,
      role: 'owner',
      display_name: providedName || 'Owner',
      title: 'Owner',
      status: 'active',
      updated_at: now,
    },
    { onConflict: 'organization_id,user_id' },
  );

  if (membershipError) throw membershipError;

  // Keep clinic_profiles in sync when the row already exists; create a stub if not.
  // Never seed clinic_name with a placeholder like "Clinic".
  const { data: existingProfile } = await supabase
    .from('clinic_profiles')
    .select('id, clinic_name')
    .eq('id', organizationId)
    .maybeSingle();

  const existingName = existingProfile?.clinic_name?.trim() ?? '';
  const shouldClearPlaceholder =
    !providedName &&
    (!existingName || PLACEHOLDER_NAMES.has(existingName.toLowerCase()));

  if (existingProfile) {
    const { error: profileError } = await supabase
      .from('clinic_profiles')
      .update({
        account_type: accountType,
        organization_id: organizationId,
        ...(shouldClearPlaceholder ? { clinic_name: '' } : {}),
        updated_at: now,
      })
      .eq('id', organizationId);
    if (profileError) throw profileError;
  } else {
    const { error: profileError } = await supabase.from('clinic_profiles').upsert(
      {
        id: organizationId,
        clinic_name: providedName,
        account_type: accountType,
        organization_id: organizationId,
        updated_at: now,
      },
      { onConflict: 'id' },
    );
    if (profileError) throw profileError;
  }

  if (accountType === 'group') {
    await deleteIncompleteGroupLocationStubs(organizationId);
  }

  return organization as ClinicOrganization;
}

/** Remove address-less locations auto-seeded before group setup completed. */
export async function deleteIncompleteGroupLocationStubs(
  organizationId: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_locations')
    .select('id, address_line1')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const stubIds = (data ?? [])
    .filter((row) => !row.address_line1?.trim())
    .map((row) => row.id);

  if (stubIds.length === 0) return;

  const { error: deleteError } = await supabase
    .from('clinic_locations')
    .delete()
    .in('id', stubIds);

  if (deleteError) throw deleteError;
}

export async function createClinicLocation(
  organizationId: string,
  input: ClinicLocationInput,
): Promise<ClinicLocation> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const existing = await listClinicLocations(organizationId);
  const makePrimary = input.is_primary ?? existing.length === 0;

  if (makePrimary) {
    await supabase
      .from('clinic_locations')
      .update({ is_primary: false, updated_at: now })
      .eq('organization_id', organizationId)
      .eq('is_primary', true);
  }

  const locationName = input.name.trim();
  if (!locationName) {
    throw new Error('Location name is required.');
  }

  const { data, error } = await supabase
    .from('clinic_locations')
    .insert({
      organization_id: organizationId,
      name: locationName,
      address_line1: input.address_line1 ?? null,
      address_line2: input.address_line2 ?? null,
      city: input.city ?? null,
      province: input.province ?? 'NS',
      postal_code: input.postal_code ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      phone: input.phone ?? null,
      contact_name: input.contact_name ?? null,
      specialty: input.specialty ?? 'general',
      software_used: input.software_used ?? [],
      operatories_count: input.operatories_count ?? null,
      team_size_range: input.team_size_range ?? null,
      is_primary: makePrimary,
      is_active: input.is_active ?? true,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;

  const location = data as ClinicLocation;

  // Adding a second location promotes the account to a group.
  if (existing.length >= 1) {
    await supabase
      .from('clinic_organizations')
      .update({ account_type: 'group', updated_at: now })
      .eq('id', organizationId);
    await supabase
      .from('clinic_profiles')
      .update({ account_type: 'group', updated_at: now })
      .eq('id', organizationId);
  }

  await syncPrimaryLocationToClinicProfile(location);
  return location;
}

/** Mirror active primary location practice/address onto owner clinic_profiles. */
export async function syncPrimaryLocationToClinicProfile(
  location: ClinicLocation,
): Promise<void> {
  if (!location.is_primary || !location.is_active) return;

  const supabase = getSupabaseClient();
  const payload: Record<string, unknown> = {
    address_line1: location.address_line1,
    address_line2: location.address_line2,
    city: location.city,
    province: location.province,
    postal_code: location.postal_code,
    latitude: location.latitude,
    longitude: location.longitude,
    specialty: location.specialty,
    software_used: location.software_used,
    operatories_count: location.operatories_count,
    team_size_range: location.team_size_range,
    updated_at: new Date().toISOString(),
  };
  // Do not wipe org contact fields with empty location values.
  if (location.phone?.trim()) payload.phone = location.phone.trim();
  if (location.contact_name?.trim()) payload.contact_name = location.contact_name.trim();
  // Keep org logo in sync with the primary location photo when present.
  if (location.logo_storage_path) {
    payload.logo_storage_path = location.logo_storage_path;
    payload.logo_uploaded_at = location.logo_uploaded_at;
  }

  const { error } = await supabase
    .from('clinic_profiles')
    .update(payload)
    .eq('id', location.organization_id);

  if (error) throw error;
}

export async function updateClinicLocation(
  locationId: string,
  input: Partial<ClinicLocationInput>,
): Promise<ClinicLocation> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data: current, error: currentError } = await supabase
    .from('clinic_locations')
    .select('*')
    .eq('id', locationId)
    .single();

  if (currentError) throw currentError;
  const location = current as ClinicLocation;

  if (input.is_primary) {
    await supabase
      .from('clinic_locations')
      .update({ is_primary: false, updated_at: now })
      .eq('organization_id', location.organization_id)
      .eq('is_primary', true)
      .neq('id', locationId);
  }

  const payload: Record<string, unknown> = { updated_at: now };
  if (input.name !== undefined) payload.name = input.name.trim() || location.name;
  if (input.address_line1 !== undefined) payload.address_line1 = input.address_line1;
  if (input.address_line2 !== undefined) payload.address_line2 = input.address_line2;
  if (input.city !== undefined) payload.city = input.city;
  if (input.province !== undefined) payload.province = input.province;
  if (input.postal_code !== undefined) payload.postal_code = input.postal_code;
  if (input.latitude !== undefined) payload.latitude = input.latitude;
  if (input.longitude !== undefined) payload.longitude = input.longitude;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.contact_name !== undefined) payload.contact_name = input.contact_name;
  if (input.specialty !== undefined) payload.specialty = input.specialty;
  if (input.software_used !== undefined) payload.software_used = input.software_used;
  if (input.operatories_count !== undefined) payload.operatories_count = input.operatories_count;
  if (input.team_size_range !== undefined) payload.team_size_range = input.team_size_range;
  if (input.is_primary !== undefined) payload.is_primary = input.is_primary;
  if (input.is_active !== undefined) payload.is_active = input.is_active;

  const { data, error } = await supabase
    .from('clinic_locations')
    .update(payload)
    .eq('id', locationId)
    .select('*')
    .single();

  if (error) throw error;

  const updated = data as ClinicLocation;
  await syncPrimaryLocationToClinicProfile(updated);

  // If primary was deactivated, promote another active location and re-sync profile.
  if (location.is_primary && updated.is_active === false) {
    const remaining = await listClinicLocations(location.organization_id, { activeOnly: true });
    const nextPrimary = remaining.find((row) => row.id !== locationId);
    if (nextPrimary) {
      return updateClinicLocation(nextPrimary.id, { is_primary: true });
    }
  }

  return updated;
}

export async function deactivateClinicLocation(locationId: string): Promise<ClinicLocation> {
  const supabase = getSupabaseClient();
  const { data: current, error } = await supabase
    .from('clinic_locations')
    .select('id, organization_id')
    .eq('id', locationId)
    .single();
  if (error) throw error;

  const active = await listClinicLocations(current.organization_id as string, { activeOnly: true });
  if (active.length <= 1) {
    throw new Error('Keep at least one active location.');
  }

  return updateClinicLocation(locationId, { is_active: false, is_primary: false });
}

export async function listClinicMemberships(organizationId: string): Promise<ClinicMembership[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_memberships')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('role', { ascending: true })
    .order('display_name', { ascending: true });

  if (error) throw error;

  const memberships = (data ?? []) as ClinicMembership[];
  if (memberships.length === 0) return [];

  const { data: assignments, error: assignmentError } = await supabase
    .from('clinic_member_location_assignments')
    .select('membership_id, location_id')
    .in(
      'membership_id',
      memberships.map((membership) => membership.id),
    );

  if (assignmentError) throw assignmentError;

  const byMembership = new Map<string, string[]>();
  for (const row of assignments ?? []) {
    const list = byMembership.get(row.membership_id as string) ?? [];
    list.push(row.location_id as string);
    byMembership.set(row.membership_id as string, list);
  }

  return memberships.map((membership) => ({
    ...membership,
    location_ids: byMembership.get(membership.id) ?? [],
  }));
}

export async function setManagerLocationAssignments(
  membershipId: string,
  locationIds: string[],
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error: deleteError } = await supabase
    .from('clinic_member_location_assignments')
    .delete()
    .eq('membership_id', membershipId);

  if (deleteError) throw deleteError;

  if (locationIds.length === 0) return;

  const { error: insertError } = await supabase.from('clinic_member_location_assignments').insert(
    locationIds.map((locationId) => ({
      membership_id: membershipId,
      location_id: locationId,
    })),
  );

  if (insertError) throw insertError;
}

export async function updateClinicMembershipProfile(
  membershipId: string,
  input: { display_name?: string | null; title?: string | null },
): Promise<ClinicMembership> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_memberships')
    .update({
      display_name: input.display_name,
      title: input.title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', membershipId)
    .select('*')
    .single();

  if (error) throw error;
  return data as ClinicMembership;
}

export async function listClinicInvitations(
  organizationId: string,
): Promise<ClinicInvitation[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_invitations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClinicInvitation[];
}

export async function createClinicManagerInvitation(input: {
  organizationId: string;
  email: string;
  displayName?: string | null;
  title?: string | null;
  locationIds?: string[];
}): Promise<ClinicInvitation> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('create_clinic_manager_invitation', {
    p_organization_id: input.organizationId,
    p_email: input.email.trim().toLowerCase(),
    p_display_name: input.displayName?.trim() || null,
    p_title: input.title?.trim() || null,
    p_location_ids: input.locationIds ?? [],
  });

  if (error) {
    throw new Error(error.message || 'Could not send invitation.');
  }
  return data as ClinicInvitation;
}

export async function revokeClinicManagerInvitation(invitationId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('revoke_clinic_manager_invitation', {
    p_invitation_id: invitationId,
  });
  if (error) throw error;
}

export async function resendClinicManagerInvitation(
  invitationId: string,
): Promise<ClinicInvitation> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('resend_clinic_manager_invitation', {
    p_invitation_id: invitationId,
  });
  if (error) {
    throw new Error(error.message || 'Could not resend invitation.');
  }
  return data as ClinicInvitation;
}

export async function previewClinicManagerInvitation(
  token: string,
): Promise<ClinicInvitationPreview> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('preview_clinic_manager_invitation', {
    p_token: token.trim(),
  });
  if (error) {
    throw new Error(error.message || 'Could not load invitation.');
  }
  const preview = (data ?? { status: 'not_found' }) as ClinicInvitationPreview;
  return {
    ...preview,
    location_names: Array.isArray(preview.location_names) ? preview.location_names : [],
  };
}

export async function acceptClinicManagerInvitation(token: string): Promise<ClinicMembership> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('accept_clinic_manager_invitation', {
    p_token: token,
  });
  if (error) throw new Error(error.message || 'Could not accept invitation.');
  return data as ClinicMembership;
}

export async function removeClinicManager(membershipId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('remove_clinic_manager', {
    p_membership_id: membershipId,
  });
  if (error) throw error;
}

export async function transferClinicOrganizationOwnership(
  organizationId: string,
  newOwnerMembershipId: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('transfer_clinic_organization_ownership', {
    p_organization_id: organizationId,
    p_new_owner_membership_id: newOwnerMembershipId,
  });
  if (error) throw error;
}
