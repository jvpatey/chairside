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
  deleteJobPost,
  getClinicDashboardCounts,
  getJobPost,
  getJobPostApplicationCount,
  listJobPosts,
  listShiftPosts,
  updateJobPost,
  updateJobPostStatus,
  type ClinicDashboardCounts,
  type CreateJobPostInput,
  type CreateShiftPostInput,
  type EmploymentType,
  type JobPost,
  type JobPostStatus,
  type PostStatus,
  type RoleType,
  type ShiftPost,
  type ShiftPostStatus,
  type ShiftUrgency,
  type UpdateJobPostInput,
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
