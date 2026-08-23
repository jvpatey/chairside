export type DashboardWelcomeRole = 'worker' | 'clinic';

export type DashboardWelcomeCopy = {
  title: string;
  subtitle: string;
  bullets: string[];
  ctaLabel: string;
};

const WORKER_COPY: DashboardWelcomeCopy = {
  title: 'Welcome to Chairside',
  subtitle: 'Your profile is ready — finish a few quick steps before you apply.',
  bullets: [
    'Set up your application profile — resume, photo, and cover note',
    'Browse open roles and fill-ins in your province',
    'Turn on fill-in alerts when you want short-notice work',
  ],
  ctaLabel: 'Explore dashboard',
};

const CLINIC_COPY: DashboardWelcomeCopy = {
  title: 'Welcome to Chairside',
  subtitle: 'Your clinic profile is live — start connecting with candidates.',
  bullets: [
    'Post a fill-in shift or open role',
    'Review applications and message candidates',
    'Keep your profile updated so workers trust your practice',
  ],
  ctaLabel: 'Go to dashboard',
};

const GROUP_COPY: DashboardWelcomeCopy = {
  title: 'Welcome to Chairside',
  subtitle: 'Your clinic group is live — start hiring across your locations.',
  bullets: [
    'Post a fill-in or role at any of your clinics',
    'Invite managers and keep coverage visible',
    'Review applications and message candidates',
  ],
  ctaLabel: 'Go to dashboard',
};

export function getDashboardWelcomeCopy(
  role: DashboardWelcomeRole,
  options?: { isGroup?: boolean },
): DashboardWelcomeCopy {
  if (role === 'clinic' && options?.isGroup) return GROUP_COPY;
  return role === 'clinic' ? CLINIC_COPY : WORKER_COPY;
}
