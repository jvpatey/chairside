import type { ClinicSpecialty, TeamSizeRange } from '@chairside/config';

export type UserRole = 'worker' | 'clinic';

export type Profile = {
  id: string;
  role: UserRole | null;
  display_name: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClinicProfileRow = {
  id: string;
  clinic_name: string;
  contact_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  specialty: ClinicSpecialty;
  software_used: string[];
  operatories_count: number | null;
  team_size_range: TeamSizeRange | null;
  website: string | null;
  description: string | null;
  logo_storage_path: string | null;
  logo_uploaded_at: string | null;
  setup_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobPostRow = {
  id: string;
  clinic_id: string;
  role_type: string;
  employment_type: string;
  title: string;
  wage_range: string | null;
  schedule: string | null;
  description: string | null;
  required_qualifications: string[];
  preferred_qualifications: string[];
  specialty: string;
  software_used: string[];
  start_date: string | null;
  benefits: string | null;
  offerings: string[];
  status: string;
  created_at: string;
  updated_at: string;
};

export type ShiftPostRow = {
  id: string;
  clinic_id: string;
  role_type: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  compensation: string | null;
  urgency: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ApplicationRow = {
  id: string;
  job_post_id: string | null;
  shift_post_id: string | null;
  worker_id: string;
  status: string;
  match_score: number | null;
  cover_message: string | null;
  years_of_experience: number | null;
  education: string | null;
  role_type: string | null;
  license_type: string | null;
  resume_storage_path: string | null;
  worker_display_name: string | null;
  worker_address: string | null;
  worker_photo_storage_path: string | null;
  software_used: string[];
  practice_types: string[];
  created_at: string;
  updated_at: string;
};

export type WorkerProfileRow = {
  id: string;
  role_type: string | null;
  license_type: string | null;
  years_of_experience: number | null;
  education: string | null;
  education_graduation_year: number | null;
  education_degree_type: string | null;
  education_field: string | null;
  education_institution: string | null;
  software_used: string[];
  practice_types: string[];
  preferred_employment_types: string[];
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  travel_radius_km: number | null;
  travel_radius_range: string | null;
  bio: string | null;
  short_notice_available: boolean;
  fill_in_notification_mode: string;
  phone: string | null;
  fill_in_sms_opt_in: boolean;
  job_notification_opt_in: boolean;
  expo_push_token: string | null;
  resume_storage_path: string | null;
  resume_file_name: string | null;
  resume_uploaded_at: string | null;
  photo_storage_path: string | null;
  photo_uploaded_at: string | null;
  default_cover_message: string | null;
  setup_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AvailabilityBlockRow = {
  id: string;
  worker_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          role?: UserRole | null;
          display_name?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: UserRole | null;
          display_name?: string | null;
          onboarding_completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinic_profiles: {
        Row: ClinicProfileRow;
        Insert: {
          id: string;
          clinic_name?: string;
          contact_name?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          province?: string;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          specialty?: ClinicSpecialty;
          software_used?: string[];
          operatories_count?: number | null;
          team_size_range?: TeamSizeRange | null;
          website?: string | null;
          description?: string | null;
          logo_storage_path?: string | null;
          logo_uploaded_at?: string | null;
          setup_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clinic_profiles']['Insert']>;
        Relationships: [];
      };
      job_posts: {
        Row: JobPostRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      shift_posts: {
        Row: ShiftPostRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      applications: {
        Row: ApplicationRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      worker_profiles: {
        Row: WorkerProfileRow;
        Insert: {
          id: string;
          role_type?: string | null;
          license_type?: string | null;
          years_of_experience?: number | null;
          education?: string | null;
          education_graduation_year?: number | null;
          education_degree_type?: string | null;
          education_field?: string | null;
          education_institution?: string | null;
          software_used?: string[];
          practice_types?: string[];
          preferred_employment_types?: string[];
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          province?: string;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          travel_radius_km?: number | null;
          travel_radius_range?: string | null;
          bio?: string | null;
          short_notice_available?: boolean;
          fill_in_notification_mode?: string;
          phone?: string | null;
          fill_in_sms_opt_in?: boolean;
          job_notification_opt_in?: boolean;
          expo_push_token?: string | null;
          resume_storage_path?: string | null;
          resume_file_name?: string | null;
          resume_uploaded_at?: string | null;
          photo_storage_path?: string | null;
          photo_uploaded_at?: string | null;
          default_cover_message?: string | null;
          setup_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['worker_profiles']['Insert']>;
        Relationships: [];
      };
      availability_blocks: {
        Row: AvailabilityBlockRow;
        Insert: {
          worker_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['availability_blocks']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};