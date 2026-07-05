import type { LegalPageContent } from './types';

export const SUPPORT_PAGE_CONTENT: LegalPageContent = {
  title: 'Support',
  intro:
    'Need help with Chairside? We are here for clinics and dental professionals using our iOS app and web platform.',
  sections: [
    {
      title: 'Contact us',
      paragraphs: [
        'Use the form on this page to send a message. Include your account email and a short description of the issue. We typically respond within one to two business days.',
      ],
    },
    {
      title: 'Account and sign-in',
      bullets: [
        'Forgot your password? Use "Forgot password" on the sign-in screen. The reset link opens the app or web callback URL.',
        'Email not confirmed? Check spam, then request a new confirmation from sign-in.',
        'Sign in with Apple or Google is available in the native iOS app. Email/password works on web and mobile.',
      ],
    },
    {
      title: 'Delete your account',
      paragraphs: [
        'You can permanently delete your account from Profile → Account → Delete account. You will be asked to confirm twice.',
        'Deleting removes your login, profile, and uploaded files. Some historical applications and messages may remain visible to the other party as records marked no longer on Chairside, with personal details removed where possible.',
      ],
    },
    {
      title: 'Notifications',
      bullets: [
        'In-app notifications require a signed-in account with onboarding complete.',
        'Push notifications require the iOS app (not Expo Go), notification permission, and a production or TestFlight build.',
        'Manage categories under Profile → Notifications. Fill-in SMS is optional and requires your mobile number.',
      ],
    },
    {
      title: 'Uploads and files',
      bullets: [
        'Profile photos and resumes must be added from your device library or file picker.',
        'Resume preview in-app requires a native build; web may offer download or share instead.',
        'If an upload fails, check your connection and file size, then try again.',
      ],
    },
    {
      title: 'Clinics and workers',
      bullets: [
        'Clinics: complete setup (basics, location, practice info) before posting roles or fill-ins.',
        'Workers: complete setup and your application profile before applying.',
        'Messaging opens after applications or confirmed fill-in workflows as described in the app.',
      ],
    },
    {
      title: 'Report a problem',
      paragraphs: [
        'For bugs, incorrect data, or safety concerns, use the contact form above with steps to reproduce, screenshots if possible, and your device model and app version.',
      ],
    },
    {
      title: 'Legal',
      paragraphs: [
        'See our Privacy Policy and Terms of Service for how we handle data and platform use.',
      ],
    },
  ],
};
