import type {
  ClinicSpecialty,
  NotificationPreferenceCategory,
  PracticeDoctor,
  TeamSizeRange,
} from '@chairside/config';

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
  accepts_general_candidate_messages: boolean;
  practice_doctors: PracticeDoctor[];
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
  /** @deprecated Use match_tier for open roles. */
  match_score: number | null;
  match_tier: string | null;
  match_breakdown: Record<string, unknown> | null;
  cover_message: string | null;
  years_of_experience: number | null;
  education: string | null;
  role_type: string | null;
  role_types: string[];
  license_type: string | null;
  resume_storage_path: string | null;
  worker_display_name: string | null;
  worker_address: string | null;
  worker_photo_storage_path: string | null;
  software_used: string[];
  practice_types: string[];
  preferred_employment_types: string[];
  interview_at: string | null;
  interview_duration_minutes: number | null;
  interview_details: string | null;
  interview_offer_closed_by: string | null;
  worker_hidden_at: string | null;
  clinic_hidden_at: string | null;
  clinic_name: string | null;
  clinic_city: string | null;
  clinic_province: string | null;
  clinic_logo_storage_path: string | null;
  worker_account_deleted_at: string | null;
  clinic_account_deleted_at: string | null;
  application_kit_requested_at: string | null;
  application_kit_submitted_at: string | null;
  interview_proposed_at: string | null;
  interview_proposed_duration_minutes: number | null;
  interview_proposed_details: string | null;
  interview_proposed_by: string | null;
  worker_attention_at: string;
  worker_last_seen_at: string | null;
  clinic_attention_at: string;
  clinic_last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkerProfileRow = {
  id: string;
  role_type: string | null;
  role_types: string[];
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
  accepts_clinic_fill_in_outreach: boolean;
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

export type NotificationPreferenceRow = {
  user_id: string;
  category: NotificationPreferenceCategory;
  push_enabled: boolean;
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
          accepts_general_candidate_messages?: boolean;
          practice_doctors?: PracticeDoctor[];
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
          role_types?: string[];
          years_of_experience?: number | null;
          license_type?: string | null;
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
          accepts_clinic_fill_in_outreach?: boolean;
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
      worker_shift_post_views: {
        Row: {
          worker_id: string;
          shift_post_id: string;
          seen_at: string;
        };
        Insert: {
          worker_id: string;
          shift_post_id: string;
          seen_at?: string;
        };
        Update: {
          worker_id?: string;
          shift_post_id?: string;
          seen_at?: string;
        };
        Relationships: [];
      };
      worker_saved_posts: {
        Row: {
          id: string;
          worker_id: string;
          job_post_id: string | null;
          shift_post_id: string | null;
          saved_at: string;
          last_change_seen_at: string | null;
        };
        Insert: {
          id?: string;
          worker_id: string;
          job_post_id?: string | null;
          shift_post_id?: string | null;
          saved_at?: string;
          last_change_seen_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['worker_saved_posts']['Insert']>;
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
      conversations: {
        Row: {
          id: string;
          application_id: string | null;
          conversation_type: 'application' | 'general' | 'outreach';
          outreach_role_type: string | null;
          outreach_shift_date: string | null;
          outreach_start_time: string | null;
          outreach_end_time: string | null;
          worker_id: string;
          clinic_id: string;
          worker_last_read_at: string | null;
          clinic_last_read_at: string | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          last_sender_id: string | null;
          messaging_closed_at: string | null;
          worker_hidden_at: string | null;
          clinic_hidden_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          trigger_sms_alert: boolean;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          body: string;
          trigger_sms_alert?: boolean;
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreferenceRow;
        Insert: {
          user_id: string;
          category: NotificationPreferenceCategory;
          push_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>;
        Relationships: [];
      };
      clinic_subscriptions: {
        Row: {
          clinic_id: string;
          provider: string;
          provider_customer_id: string | null;
          plan: 'free' | 'starter' | 'pro';
          status: 'active' | 'trialing' | 'grace_period' | 'cancelled' | 'expired';
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          clinic_id: string;
          provider?: string;
          provider_customer_id?: string | null;
          plan?: 'free' | 'starter' | 'pro';
          status?: 'active' | 'trialing' | 'grace_period' | 'cancelled' | 'expired';
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clinic_subscriptions']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      mark_conversation_read: {
        Args: { p_conversation_id: string };
        Returns: undefined;
      };
      get_or_create_general_conversation: {
        Args: { p_clinic_id: string };
        Returns: string;
      };
      hide_worker_conversation: {
        Args: { p_conversation_id: string };
        Returns: Database['public']['Tables']['conversations']['Row'];
      };
      hide_clinic_conversation: {
        Args: { p_conversation_id: string };
        Returns: Database['public']['Tables']['conversations']['Row'];
      };
      accept_application_interview: {
        Args: { application_id: string };
        Returns: ApplicationRow;
      };
      decline_application_interview: {
        Args: { application_id: string };
        Returns: ApplicationRow;
      };
      confirm_fill_in_applicant: {
        Args: { application_id: string };
        Returns: ApplicationRow;
      };
      hide_worker_application: {
        Args: { application_id: string };
        Returns: ApplicationRow;
      };
      hide_clinic_application: {
        Args: { application_id: string };
        Returns: ApplicationRow;
      };
      mark_application_seen_by_worker: {
        Args: { application_id: string };
        Returns: ApplicationRow;
      };
      mark_application_seen_by_clinic: {
        Args: { application_id: string };
        Returns: ApplicationRow;
      };
      mark_applications_seen_by_worker: {
        Args: { application_ids: string[] };
        Returns: undefined;
      };
      mark_shift_posts_seen_by_worker: {
        Args: { shift_post_ids: string[] };
        Returns: undefined;
      };
      save_job_post_for_worker: {
        Args: { p_job_post_id: string };
        Returns: undefined;
      };
      unsave_job_post_for_worker: {
        Args: { p_job_post_id: string };
        Returns: undefined;
      };
      save_shift_post_for_worker: {
        Args: { p_shift_post_id: string };
        Returns: undefined;
      };
      unsave_shift_post_for_worker: {
        Args: { p_shift_post_id: string };
        Returns: undefined;
      };
      list_fill_in_outreach_workers_for_clinic: {
        Args: { p_role_type?: string | null };
        Returns: {
          worker_id: string;
          display_name: string;
          role_types: string[];
          city: string | null;
          years_of_experience: number | null;
          short_notice_available: boolean;
          photo_storage_path: string | null;
          availability_summary: string | null;
          existing_conversation_id: string | null;
          sms_opt_in: boolean;
        }[];
      };
      start_clinic_fill_in_outreach: {
        Args: {
          p_worker_id: string;
          p_message: string;
          p_role_type?: string | null;
          p_shift_date?: string | null;
          p_start_time?: string | null;
          p_end_time?: string | null;
          p_send_sms?: boolean;
        };
        Returns: string;
      };
      get_clinic_billing_state: {
        Args: { p_clinic_id?: string };
        Returns: {
          plan: 'free' | 'starter' | 'pro';
          status: 'active' | 'trialing' | 'grace_period' | 'cancelled' | 'expired';
          active_opportunity_count: number;
          active_opportunity_limit: number | null;
          can_publish_opportunity: boolean;
          can_use_fill_in_outreach: boolean;
          can_use_fill_in_sms: boolean;
          has_priority_listing: boolean;
          current_period_end: string | null;
        };
      };
      get_clinic_plan_map: {
        Args: { p_clinic_ids: string[] };
        Returns: { clinic_id: string; plan: 'free' | 'starter' | 'pro' }[];
      };
      upsert_clinic_subscription: {
        Args: {
          p_clinic_id: string;
          p_plan: 'free' | 'starter' | 'pro';
          p_status: 'active' | 'trialing' | 'grace_period' | 'cancelled' | 'expired';
          p_current_period_end?: string | null;
          p_provider_customer_id?: string | null;
        };
        Returns: Database['public']['Tables']['clinic_subscriptions']['Row'];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
