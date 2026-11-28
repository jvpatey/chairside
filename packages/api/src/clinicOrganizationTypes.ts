export type ClinicAccountType = 'individual' | 'group';
export type ClinicMembershipRole = 'owner' | 'manager';
export type ClinicMembershipStatus = 'active' | 'removed';
export type ClinicOrganization = {
  id: string;
  account_type: ClinicAccountType;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ClinicLocation = {
  id: string;
  organization_id: string;
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  contact_name: string | null;
  specialty: string;
  software_used: string[];
  operatories_count: number | null;
  team_size_range: string | null;
  logo_storage_path: string | null;
  logo_uploaded_at: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClinicMembership = {
  id: string;
  organization_id: string;
  user_id: string;
  role: ClinicMembershipRole;
  display_name: string | null;
  title: string | null;
  bio: string | null;
  photo_storage_path: string | null;
  photo_uploaded_at: string | null;
  status: ClinicMembershipStatus;
  created_at: string;
  updated_at: string;
  location_ids?: string[];
};

export type ClinicLocationInput = {
  name: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  province?: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  contact_name?: string | null;
  specialty?: string;
  software_used?: string[];
  operatories_count?: number | null;
  team_size_range?: string | null;
  is_primary?: boolean;
  is_active?: boolean;
};

export type ClinicWorkspace = {
  organization: ClinicOrganization;
  membership: ClinicMembership;
  locations: ClinicLocation[];
  accessibleLocationIds: string[] | 'all';
  isOwner: boolean;
  isGroup: boolean;
};
