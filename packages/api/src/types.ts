import type { ClinicSpecialty } from '@chairside/config';

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
  team_size: number | null;
  website: string | null;
  description: string | null;
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
          team_size?: number | null;
          website?: string | null;
          description?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};