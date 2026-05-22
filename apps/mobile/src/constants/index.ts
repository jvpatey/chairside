export const APP_NAME = 'Chairside';

export const ONBOARDING_SUBTITLE = 'Dental staffing, simplified.';

export const ROLE_OPTIONS = [
  {
    role: 'worker' as const,
    title: 'Find work',
    description: 'Browse shifts and permanent roles in Nova Scotia',
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
