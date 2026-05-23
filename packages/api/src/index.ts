export { createSupabaseClient, getSupabaseClient } from './client';
export {
  createSessionFromUrl,
  getAuthErrorMessage,
  resetPasswordForEmail,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
} from './auth';
export {
  completeClinicSetup,
  getClinicProfile,
  getMissingClinicProfileFields,
  isClinicProfileComplete,
  upsertClinicProfile,
  type ClinicProfile,
  type ClinicProfileUpdate,
} from './clinicProfile';
export { parseMapboxFeature, searchAddresses, type AddressSuggestion, type ParsedAddress } from './mapbox';
export {
  createJobPost,
  createShiftPost,
  getClinicDashboardCounts,
  listJobPosts,
  listShiftPosts,
  type ClinicDashboardCounts,
  type CreateJobPostInput,
  type CreateShiftPostInput,
  type EmploymentType,
  type JobPost,
  type PostStatus,
  type RoleType,
  type ShiftPost,
  type ShiftUrgency,
} from './posts';
export {
  listClinicApplications,
  updateApplicationStatus,
  type Application,
  type ApplicationStatus,
  type ClinicApplication,
} from './applications';
export { getProfile, setProfileRole } from './profile';
export type { Database, Profile, UserRole } from './types';
