export type ClinicAccountType = 'individual' | 'group';
export type ClinicMembershipRole = 'owner' | 'manager';
export type ClinicMembershipStatus = 'active' | 'removed';
export type ClinicInvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

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

export type ClinicInvitation = {
  id: string;
  organization_id: string;
  email: string;
  display_name: string | null;
  title: string | null;
  role: 'manager';
  token: string;
  location_ids: string[];
  status: ClinicInvitationStatus;
  invited_by_user_id: string | null;
  expires_at: string;
  accepted_by_user_id: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClinicInvitationPreviewStatus =
  | 'pending'
  | 'accepted'
  | 'revoked'
  | 'expired'
  | 'not_found';

export type ClinicInvitationPreview = {
  status: ClinicInvitationPreviewStatus;
  email?: string;
  display_name?: string | null;
  title?: string | null;
  organization_name?: string;
  inviter_name?: string;
  location_names?: string[];
  expires_at?: string;
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
