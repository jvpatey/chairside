import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLE_TYPES = new Set(['hygienist', 'assistant', 'dentist', 'other']);
const EMPLOYMENT_TYPES = new Set(['permanent', 'part-time', 'temp', 'fill-in']);
const JOB_STATUSES = new Set(['live', 'paused', 'filled', 'closed']);
const SHIFT_STATUSES = new Set(['draft', 'live', 'filled', 'closed']);
const KIND_VALUES = new Set(['role', 'fill_in']);

type ListingKind = 'role' | 'fill_in';

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseAllowlist(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asOptionalTrimmed(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requireContact(fields: {
  contact_phone: string | null;
  contact_email: string | null;
  external_url: string | null;
}): string | null {
  if (fields.contact_phone || fields.contact_email || fields.external_url) return null;
  return 'Provide at least one contact method (phone, email, or URL).';
}

function mapRow(row: Record<string, unknown>, kind: ListingKind) {
  return {
    id: row.id,
    kind,
    roleType: row.role_type,
    status: row.status,
    displayClinicName: row.display_clinic_name,
    displayCity: row.display_city,
    displayProvince: row.display_province,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    externalUrl: row.external_url,
    adminNotes: row.admin_notes,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(kind === 'role'
      ? {
          title: row.title,
          employmentType: row.employment_type,
          wageRange: row.wage_range,
          schedule: row.schedule,
        }
      : {
          shiftDate: row.shift_date,
          startTime: row.start_time,
          endTime: row.end_time,
          compensation: row.compensation,
          urgency: row.urgency,
        }),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const adminEmails = parseAllowlist(Deno.env.get('ADMIN_EMAILS'));

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    if (adminEmails.size === 0) {
      return jsonResponse({ error: 'Admin allowlist is not configured' }, 500);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: 'Invalid or expired session' }, 401);
    }

    const email = user.email?.trim().toLowerCase() ?? '';
    if (!email || !adminEmails.has(email)) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return jsonResponse({ error: 'Invalid request body' }, 400);
    }

    const action = asTrimmedString(body.action);
    if (!action) {
      return jsonResponse({ error: 'Missing action' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === 'list') {
      const kindRaw = asTrimmedString(body.kind);
      const kind: ListingKind | 'all' =
        kindRaw && KIND_VALUES.has(kindRaw) ? (kindRaw as ListingKind) : 'all';

      const rolesResult =
        kind === 'fill_in'
          ? { data: [] as Record<string, unknown>[], error: null }
          : await adminClient
              .from('job_posts')
              .select(
                'id, role_type, status, title, employment_type, wage_range, schedule, description, display_clinic_name, display_city, display_province, contact_phone, contact_email, external_url, admin_notes, created_at, updated_at',
              )
              .eq('is_sourced', true)
              .order('created_at', { ascending: false });

      if (rolesResult.error) throw rolesResult.error;

      const fillInsResult =
        kind === 'role'
          ? { data: [] as Record<string, unknown>[], error: null }
          : await adminClient
              .from('shift_posts')
              .select(
                'id, role_type, status, shift_date, start_time, end_time, compensation, urgency, description, display_clinic_name, display_city, display_province, contact_phone, contact_email, external_url, admin_notes, created_at, updated_at',
              )
              .eq('is_sourced', true)
              .order('created_at', { ascending: false });

      if (fillInsResult.error) throw fillInsResult.error;

      return jsonResponse(
        {
          roles: ((rolesResult.data ?? []) as Record<string, unknown>[]).map((row) =>
            mapRow(row, 'role'),
          ),
          fillIns: ((fillInsResult.data ?? []) as Record<string, unknown>[]).map((row) =>
            mapRow(row, 'fill_in'),
          ),
        },
        200,
      );
    }

    if (action === 'create') {
      const kind = asTrimmedString(body.kind);
      if (!kind || !KIND_VALUES.has(kind)) {
        return jsonResponse({ error: 'kind must be role or fill_in' }, 400);
      }

      const displayClinicName = asTrimmedString(body.displayClinicName);
      const displayCity = asTrimmedString(body.displayCity);
      const displayProvince = asTrimmedString(body.displayProvince)?.toUpperCase() ?? null;
      const roleType = asTrimmedString(body.roleType) ?? 'hygienist';
      const contactPhone = asOptionalTrimmed(body.contactPhone);
      const contactEmail = asOptionalTrimmed(body.contactEmail);
      const externalUrl = asOptionalTrimmed(body.externalUrl);
      const adminNotes = asOptionalTrimmed(body.adminNotes);
      const description = asOptionalTrimmed(body.description);

      if (!displayClinicName || !displayCity || !displayProvince) {
        return jsonResponse(
          { error: 'displayClinicName, displayCity, and displayProvince are required' },
          400,
        );
      }
      if (!ROLE_TYPES.has(roleType)) {
        return jsonResponse({ error: 'Invalid roleType' }, 400);
      }
      const contactError = requireContact({
        contact_phone: contactPhone,
        contact_email: contactEmail,
        external_url: externalUrl,
      });
      if (contactError) return jsonResponse({ error: contactError }, 400);

      const shared = {
        is_sourced: true,
        clinic_id: null,
        organization_id: null,
        location_id: null,
        role_type: roleType,
        status: 'live',
        display_clinic_name: displayClinicName,
        display_city: displayCity,
        display_province: displayProvince,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        external_url: externalUrl,
        admin_notes: adminNotes,
        description,
      };

      if (kind === 'role') {
        const title = asTrimmedString(body.title);
        if (!title) return jsonResponse({ error: 'title is required for roles' }, 400);
        const employmentType = asTrimmedString(body.employmentType) ?? 'permanent';
        if (!EMPLOYMENT_TYPES.has(employmentType)) {
          return jsonResponse({ error: 'Invalid employmentType' }, 400);
        }

        const { data, error } = await adminClient
          .from('job_posts')
          .insert({
            ...shared,
            title,
            employment_type: employmentType,
            wage_range: asOptionalTrimmed(body.wageRange),
            schedule: asOptionalTrimmed(body.schedule),
            specialty: 'general',
            software_used: [],
            required_qualifications: [],
            preferred_qualifications: [],
            offerings: [],
            screening_enabled: false,
          })
          .select(
            'id, role_type, status, title, employment_type, wage_range, schedule, description, display_clinic_name, display_city, display_province, contact_phone, contact_email, external_url, admin_notes, created_at, updated_at',
          )
          .single();

        if (error) throw error;
        return jsonResponse({ listing: mapRow(data as Record<string, unknown>, 'role') }, 200);
      }

      const shiftDate = asTrimmedString(body.shiftDate);
      const startTime = asTrimmedString(body.startTime);
      const endTime = asTrimmedString(body.endTime);
      if (!shiftDate || !startTime || !endTime) {
        return jsonResponse(
          { error: 'shiftDate, startTime, and endTime are required for fill-ins' },
          400,
        );
      }

      const { data, error } = await adminClient
        .from('shift_posts')
        .insert({
          ...shared,
          shift_date: shiftDate,
          start_time: startTime,
          end_time: endTime,
          compensation: asOptionalTrimmed(body.compensation),
          urgency: asOptionalTrimmed(body.urgency) ?? 'normal',
        })
        .select(
          'id, role_type, status, shift_date, start_time, end_time, compensation, urgency, description, display_clinic_name, display_city, display_province, contact_phone, contact_email, external_url, admin_notes, created_at, updated_at',
        )
        .single();

      if (error) throw error;
      return jsonResponse({ listing: mapRow(data as Record<string, unknown>, 'fill_in') }, 200);
    }

    if (action === 'update' || action === 'setStatus' || action === 'delete') {
      const kind = asTrimmedString(body.kind);
      const id = asTrimmedString(body.id);
      if (!kind || !KIND_VALUES.has(kind)) {
        return jsonResponse({ error: 'kind must be role or fill_in' }, 400);
      }
      if (!id || !UUID_PATTERN.test(id)) {
        return jsonResponse({ error: 'Valid id is required' }, 400);
      }

      const table = kind === 'role' ? 'job_posts' : 'shift_posts';

      if (action === 'delete') {
        const { error } = await adminClient
          .from(table)
          .delete()
          .eq('id', id)
          .eq('is_sourced', true);
        if (error) throw error;
        return jsonResponse({ ok: true }, 200);
      }

      if (action === 'setStatus') {
        const status = asTrimmedString(body.status);
        const allowed = kind === 'role' ? JOB_STATUSES : SHIFT_STATUSES;
        if (!status || !allowed.has(status)) {
          return jsonResponse({ error: 'Invalid status' }, 400);
        }
        const { data, error } = await adminClient
          .from(table)
          .update({ status })
          .eq('id', id)
          .eq('is_sourced', true)
          .select(
            kind === 'role'
              ? 'id, role_type, status, title, employment_type, wage_range, schedule, description, display_clinic_name, display_city, display_province, contact_phone, contact_email, external_url, admin_notes, created_at, updated_at'
              : 'id, role_type, status, shift_date, start_time, end_time, compensation, urgency, description, display_clinic_name, display_city, display_province, contact_phone, contact_email, external_url, admin_notes, created_at, updated_at',
          )
          .maybeSingle();
        if (error) throw error;
        if (!data) return jsonResponse({ error: 'Listing not found' }, 404);
        return jsonResponse(
          { listing: mapRow(data as Record<string, unknown>, kind as ListingKind) },
          200,
        );
      }

      // update
      const patch: Record<string, unknown> = {};
      const displayClinicName = asOptionalTrimmed(body.displayClinicName);
      const displayCity = asOptionalTrimmed(body.displayCity);
      const displayProvince = asOptionalTrimmed(body.displayProvince);
      if (displayClinicName !== null) patch.display_clinic_name = displayClinicName;
      if (displayCity !== null) patch.display_city = displayCity;
      if (displayProvince !== null) patch.display_province = displayProvince.toUpperCase();
      if ('contactPhone' in body) patch.contact_phone = asOptionalTrimmed(body.contactPhone);
      if ('contactEmail' in body) patch.contact_email = asOptionalTrimmed(body.contactEmail);
      if ('externalUrl' in body) patch.external_url = asOptionalTrimmed(body.externalUrl);
      if ('adminNotes' in body) patch.admin_notes = asOptionalTrimmed(body.adminNotes);
      if ('description' in body) patch.description = asOptionalTrimmed(body.description);

      const roleType = asOptionalTrimmed(body.roleType);
      if (roleType !== null) {
        if (!ROLE_TYPES.has(roleType)) return jsonResponse({ error: 'Invalid roleType' }, 400);
        patch.role_type = roleType;
      }

      if (kind === 'role') {
        if ('title' in body) {
          const title = asTrimmedString(body.title);
          if (!title) return jsonResponse({ error: 'title cannot be empty' }, 400);
          patch.title = title;
        }
        const employmentType = asOptionalTrimmed(body.employmentType);
        if (employmentType !== null) {
          if (!EMPLOYMENT_TYPES.has(employmentType)) {
            return jsonResponse({ error: 'Invalid employmentType' }, 400);
          }
          patch.employment_type = employmentType;
        }
        if ('wageRange' in body) patch.wage_range = asOptionalTrimmed(body.wageRange);
        if ('schedule' in body) patch.schedule = asOptionalTrimmed(body.schedule);
      } else {
        if ('shiftDate' in body) {
          const shiftDate = asTrimmedString(body.shiftDate);
          if (!shiftDate) return jsonResponse({ error: 'shiftDate cannot be empty' }, 400);
          patch.shift_date = shiftDate;
        }
        if ('startTime' in body) {
          const startTime = asTrimmedString(body.startTime);
          if (!startTime) return jsonResponse({ error: 'startTime cannot be empty' }, 400);
          patch.start_time = startTime;
        }
        if ('endTime' in body) {
          const endTime = asTrimmedString(body.endTime);
          if (!endTime) return jsonResponse({ error: 'endTime cannot be empty' }, 400);
          patch.end_time = endTime;
        }
        if ('compensation' in body) patch.compensation = asOptionalTrimmed(body.compensation);
        if ('urgency' in body) patch.urgency = asOptionalTrimmed(body.urgency) ?? 'normal';
      }

      if (Object.keys(patch).length === 0) {
        return jsonResponse({ error: 'No fields to update' }, 400);
      }

      const { data, error } = await adminClient
        .from(table)
        .update(patch)
        .eq('id', id)
        .eq('is_sourced', true)
        .select(
          kind === 'role'
            ? 'id, role_type, status, title, employment_type, wage_range, schedule, description, display_clinic_name, display_city, display_province, contact_phone, contact_email, external_url, admin_notes, created_at, updated_at'
            : 'id, role_type, status, shift_date, start_time, end_time, compensation, urgency, description, display_clinic_name, display_city, display_province, contact_phone, contact_email, external_url, admin_notes, created_at, updated_at',
        )
        .maybeSingle();

      if (error) throw error;
      if (!data) return jsonResponse({ error: 'Listing not found' }, 404);
      return jsonResponse(
        { listing: mapRow(data as Record<string, unknown>, kind as ListingKind) },
        200,
      );
    }

    return jsonResponse({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('[admin-sourced-listings]', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});
