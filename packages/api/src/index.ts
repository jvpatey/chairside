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
export { getProfile, setProfileRole } from './profile';
export type { Database, Profile, UserRole } from './types';
