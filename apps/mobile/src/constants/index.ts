export const APP_NAME = 'Chairside';

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
