export const APP_NAME = 'Chairside';

export {
  getPublicLegalUrl,
  getPublicWebBaseUrl,
  LEGAL_LAST_UPDATED,
  PUBLIC_LEGAL_PATHS,
} from './legal';

/** Set when the App Store listing is live, e.g. https://apps.apple.com/app/id… */
export const APP_STORE_URL: string | null = null;

export const ONBOARDING_SUBTITLE =
  'Post a fill-in and nearby professionals get it by text. You choose who covers.';

export const ROLE_OPTIONS = [
  {
    role: 'worker' as const,
    title: 'Find work',
    description: 'Get fill-in texts, request cover, and browse permanent roles',
    icon: 'briefcase-outline' as const,
  },
  {
    role: 'clinic' as const,
    title: 'Hire staff',
    description: 'Post fill-ins by text, confirm cover, and list permanent roles',
    icon: 'business-outline' as const,
  },
];

// Future env keys (wire up when Supabase is added):
// EXPO_PUBLIC_SUPABASE_URL
// EXPO_PUBLIC_SUPABASE_ANON_KEY
