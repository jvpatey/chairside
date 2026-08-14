import type { LiveJobPost, LiveShiftPost } from '@chairside/api';
import { calculateJobMatch, type JobMatchBreakdown, type JobMatchContext } from '@chairside/core';

import type { JobApplicantPreview } from '@/lib/dashboardAttention';
import { toISODate } from '@/lib/dates';

export const WELCOME_HERO_CLINIC = {
  id: 'preview-clinic',
  name: 'Dental Clinic',
  city: null as string | null,
  province: '',
  locationLabel: null as string | null,
} as const;

export const WELCOME_HERO_WORKER = {
  firstName: 'John',
  displayName: 'John',
} as const;

export type WelcomeHeroApplicant = JobApplicantPreview & {
  match: JobMatchBreakdown;
  matchContext: JobMatchContext;
  yearsOfExperience: number;
  education: string;
  appliedAt: string;
  status: 'applied' | 'reviewed';
  isNew: boolean;
};

export type WelcomeHeroPreview = {
  clinic: typeof WELCOME_HERO_CLINIC;
  workerFirstName: string;
  job: LiveJobPost;
  shift: LiveShiftPost;
  applicants: WelcomeHeroApplicant[];
  fillInDistanceLabel: string;
  stats: {
    openRoles: number;
    fillIns: number;
    applications: number;
  };
  workerStats: {
    openRoles: number;
    fillIns: number;
    applications: number;
  };
};

const CLINIC_SOFTWARE = ['dentrix'] as const;
const POSTED_DAYS_AGO = 3;

function daysAgoIso(now: Date, days: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function clinicSummary(): LiveShiftPost['clinic'] {
  return {
    clinic_id: WELCOME_HERO_CLINIC.id,
    clinic_name: WELCOME_HERO_CLINIC.name,
    city: WELCOME_HERO_CLINIC.city,
    province: WELCOME_HERO_CLINIC.province,
    specialty: 'general',
    software_used: [...CLINIC_SOFTWARE],
    latitude: 44.6488,
    longitude: -63.5752,
    logo_storage_path: null,
  };
}

function applicant(
  id: string,
  name: string,
  context: JobMatchContext,
  profile: {
    yearsOfExperience: number;
    education: string;
    appliedAt: string;
    status: 'applied' | 'reviewed';
    isNew?: boolean;
  },
): WelcomeHeroApplicant {
  return {
    id,
    name,
    photoPath: null,
    matchContext: context,
    match: calculateJobMatch(context),
    yearsOfExperience: profile.yearsOfExperience,
    education: profile.education,
    appliedAt: profile.appliedAt,
    status: profile.status,
    isNew: profile.isNew ?? false,
  };
}

/** Shared clinic + worker story for the public welcome hero preview. */
export function getWelcomeHeroPreview(now = new Date()): WelcomeHeroPreview {
  const createdAt = daysAgoIso(now, POSTED_DAYS_AGO);
  const shiftDate = toISODate(now);

  const job: LiveJobPost = {
    id: 'preview-job-hygienist',
    clinic_id: WELCOME_HERO_CLINIC.id,
    role_type: 'hygienist',
    employment_type: 'permanent',
    title: 'Dental Hygienist',
    wage_range: '$42–$48 / hr',
    schedule: 'Mon – Fri',
    description: null,
    required_qualifications: [],
    preferred_qualifications: [],
    specialty: 'general',
    software_used: [...CLINIC_SOFTWARE],
    start_date: null,
    benefits: null,
    offerings: [],
    screening_enabled: false,
    status: 'live',
    created_at: createdAt,
    updated_at: createdAt,
    clinic: clinicSummary(),
    screening_questions: [],
    has_priority_listing: false,
  };

  const shift: LiveShiftPost = {
    id: 'preview-shift-hygienist',
    clinic_id: WELCOME_HERO_CLINIC.id,
    role_type: 'hygienist',
    shift_date: shiftDate,
    start_time: '09:00',
    end_time: '17:00',
    compensation: null,
    urgency: 'same_day',
    description: null,
    status: 'live',
    created_at: createdAt,
    updated_at: createdAt,
    clinic: clinicSummary(),
    has_priority_listing: false,
  };

  const roleMatchBase = {
    postRoleType: job.role_type,
    postEmploymentType: job.employment_type,
    postSoftware: job.software_used,
  } as const;

  const applicants: WelcomeHeroApplicant[] = [
    applicant(
      'preview-applicant-john',
      WELCOME_HERO_WORKER.displayName,
      {
        ...roleMatchBase,
        workerRoleTypes: ['hygienist'],
        workerPreferredEmploymentTypes: ['permanent', 'fill-in'],
        workerSoftware: ['dentrix'],
        distanceKm: 4,
        workerTravelRadiusKm: 25,
      },
      {
        yearsOfExperience: 8,
        education: 'diploma',
        appliedAt: daysAgoIso(now, 1),
        status: 'applied',
        isNew: true,
      },
    ),
    applicant(
      'preview-applicant-sam',
      'Sam',
      {
        ...roleMatchBase,
        workerRoleTypes: ['hygienist'],
        workerPreferredEmploymentTypes: ['permanent'],
        workerSoftware: ['eaglesoft'],
        distanceKm: 8,
        workerTravelRadiusKm: 25,
      },
      {
        yearsOfExperience: 5,
        education: 'bachelors',
        appliedAt: daysAgoIso(now, 2),
        status: 'reviewed',
      },
    ),
    applicant(
      'preview-applicant-riley',
      'Riley',
      {
        ...roleMatchBase,
        workerRoleTypes: ['hygienist'],
        workerPreferredEmploymentTypes: ['fill-in'],
        workerSoftware: [],
        distanceKm: 6,
        workerTravelRadiusKm: 25,
      },
      {
        yearsOfExperience: 3,
        education: 'diploma',
        appliedAt: createdAt,
        status: 'applied',
      },
    ),
  ];

  return {
    clinic: WELCOME_HERO_CLINIC,
    workerFirstName: WELCOME_HERO_WORKER.firstName,
    job,
    shift,
    applicants,
    fillInDistanceLabel: 'Nearby',
    stats: {
      openRoles: 1,
      fillIns: 1,
      applications: applicants.length,
    },
    workerStats: {
      openRoles: 1,
      fillIns: 1,
      applications: 1,
    },
  };
}
