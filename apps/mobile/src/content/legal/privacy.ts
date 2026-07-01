import type { LegalPageContent } from './types';

export const PRIVACY_POLICY_CONTENT: LegalPageContent = {
  title: 'Privacy Policy',
  intro:
    'Chairside ("we", "us") operates a dental staffing platform for clinics and dental professionals in Canada. This policy describes what we collect, why we use it, and the choices you have.',
  sections: [
    {
      title: 'Information we collect',
      bullets: [
        'Account information: name, email, password (hashed), and role (clinic or worker).',
        'Profile information: clinic or worker details such as practice name, address, phone, role type, experience, skills, availability, and optional website or team information.',
        'Application kit: resumes, profile photos, clinic logos, and practice doctor photos you upload.',
        'Job and shift activity: postings, applications, screening responses, interviews, and messages between clinics and workers.',
        'Location-related data: addresses and map coordinates you enter for clinics or your worker profile. We do not continuously track your device GPS unless you grant location permission in a future feature.',
        'Notification preferences: push, in-app, and optional SMS opt-in for fill-in alerts, including your mobile number when you enable text alerts.',
        'Device and usage data: push notification tokens, basic device information for notification delivery, and standard web analytics on our website.',
      ],
    },
    {
      title: 'How we use information',
      bullets: [
        'Provide staffing features: browse roles and fill-ins, apply, message, schedule interviews, and send notifications.',
        'Match and display relevant opportunities based on role, location, and preferences.',
        'Authenticate you and keep your account secure.',
        'Send transactional notifications about applications, messages, interviews, and fill-in alerts.',
        'Respond to support messages you submit through the Support page.',
        'Improve reliability, prevent abuse, and support customers.',
      ],
    },
    {
      title: 'Third-party services',
      paragraphs: [
        'We use trusted processors to operate Chairside. They process data on our behalf under contractual safeguards:',
      ],
      bullets: [
        'Supabase — authentication, database, file storage, and server functions.',
        'Mapbox — address search and map display.',
        'Pingram — in-app notifications, mobile push, and optional SMS.',
        'Apple and Google — sign-in when you choose those options.',
        'Vercel Analytics — anonymous website usage on our web app only.',
      ],
    },
    {
      title: 'Sharing',
      paragraphs: [
        'We do not sell your personal information. We share information only as needed to operate the service:',
      ],
      bullets: [
        'Between clinics and workers when you apply, message, or participate in hiring workflows.',
        'With service providers listed above.',
        'When required by law or to protect rights, safety, and security.',
      ],
    },
    {
      title: 'Retention and account deletion',
      paragraphs: [
        'You can delete your account from Profile → Account in the app. Deleting your account removes your login, profile, and uploaded files such as photos, resumes, and logos. Live clinic postings are closed.',
        'Some historical application and message records may remain visible to the other party as needed for hiring context, marked as no longer on Chairside. Personal details in those records are removed or masked where possible.',
        'We retain other data only as long as needed for the purposes above, unless a longer period is required by law.',
      ],
    },
    {
      title: 'Your choices',
      bullets: [
        'Update profile and notification preferences in the app.',
        'Opt out of push notifications per category under Profile → Notifications, or disable push at the device level.',
        'Opt in or out of fill-in SMS alerts in the app.',
        'Delete your account at any time from Profile → Account.',
        'Contact us to request access, correction, or deletion help.',
      ],
    },
    {
      title: 'Security',
      paragraphs: [
        'We use industry-standard measures including encrypted connections, access controls, and row-level security in our database. No method of transmission or storage is completely secure.',
      ],
    },
    {
      title: 'Children',
      paragraphs: [
        'Chairside is intended for working dental professionals and clinics. It is not directed to children under 16, and we do not knowingly collect their information.',
      ],
    },
    {
      title: 'Changes',
      paragraphs: [
        'We may update this policy from time to time. We will post the revised version on this page and update the "Last updated" date.',
      ],
    },
    {
      title: 'Contact',
      paragraphs: [
        'Contact us through the Support page in the app or on our website.',
      ],
    },
  ],
};
