export const APP_NAME = 'Chairside';

export {
  getPublicLegalUrl,
  getPublicWebBaseUrl,
  LEGAL_LAST_UPDATED,
  PUBLIC_LEGAL_PATHS,
} from './legal';

/** Set when the App Store listing is live, e.g. https://apps.apple.com/app/id… */
export const APP_STORE_URL: string | null = null;

export const APP_STORE_COMING_SOON_LABEL = 'iPhone app coming soon';
export const APP_STORE_COMING_SOON_HINT =
  'Fill-in alerts and faster notifications on the go.';

export const ONBOARDING_SUBTITLE =
  'Hire staff, find work, and fill same-day shifts—all in one place.';

export const ROLE_OPTIONS = [
  {
    role: 'worker' as const,
    title: 'Find work',
    description: 'Browse permanent roles and fill-in shifts',
    icon: 'briefcase-outline' as const,
  },
  {
    role: 'clinic' as const,
    title: 'Hire staff',
    description: 'Post roles and fill chairs faster',
    icon: 'business-outline' as const,
  },
];

// Future env keys (wire up when Supabase is added):
// EXPO_PUBLIC_SUPABASE_URL
// EXPO_PUBLIC_SUPABASE_ANON_KEY
