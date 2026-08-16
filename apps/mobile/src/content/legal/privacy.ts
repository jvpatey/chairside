import type { LegalPageContent } from './types';

export const PRIVACY_POLICY_CONTENT: LegalPageContent = {
  title: 'Privacy Policy',
  intro:
    'Chairside ("we", "us") operates a dental staffing platform for clinics, dental groups, and dental professionals in Canada. This policy describes what we collect, why we use it, and the choices you have.',
  sections: [
    {
      title: 'Who this applies to',
      bullets: [
        'Clinic owners — people who create and manage an individual clinic or multi-location group account.',
        'Group managers — invited clinic logins with access limited to assigned locations.',
        'Workers (candidates) — dental professionals who browse roles and fill-ins, apply, and message clinics.',
      ],
    },
    {
      title: 'Information we collect',
      bullets: [
        'Account information: name, email, role (clinic or worker), and a hashed password when you sign in with email and password. Apple or Google sign-in may be used instead of a password.',
        'Clinic and group profile information: practice or group name, locations, addresses, phone, website, practice details (for example specialties, software, team size), logos, and practice doctor photos.',
        'Manager membership profiles: name, title, bio, and optional photo for invited group managers.',
        'Worker profile information: professional role type, experience, skills, availability, travel preferences, city and address you provide, and optional contact details.',
        'Application materials: resumes, profile photos, cover or application-kit materials, and answers to clinic screening questions.',
        'Hiring activity: role and fill-in postings, applications, interview scheduling, outreach and open-inquiry messages, and messages between clinics and workers.',
        'Clinic-side hiring notes: private notes, tags, and follow-ups clinics store about candidates for their own hiring workflow.',
        'Location-related data: addresses and map coordinates you enter for clinics or your worker profile. We do not continuously track device GPS.',
        'Notification preferences: push, in-app, and optional SMS opt-in for fill-in alerts, including your mobile number when you enable text alerts.',
        'Billing information for clinic accounts: plan, subscription status, and provider customer or entitlement identifiers needed to manage paid features. Payment card details are handled by Apple or Stripe — we do not store full card numbers.',
        'Support messages: name, email, subject, and message you submit through the Support form.',
        'Device and usage data: push notification tokens, basic device information for notification delivery, and standard web analytics on our website.',
      ],
    },
    {
      title: 'How we use information',
      bullets: [
        'Provide staffing features: post and browse roles and fill-ins, apply, message, schedule interviews, Discover candidates, send outreach, and manage hiring workflows.',
        'Match and display relevant opportunities based on role, location, plan features, and preferences.',
        'Show limited worker location context to clinics (typically city and province, not full street address) while storing the address you provide for matching and your profile.',
        'Authenticate you, keep your account secure, and manage team invites for group accounts.',
        'Send transactional notifications about applications, messages, interviews, invites, and fill-in alerts (including optional SMS when you opt in).',
        'Process clinic subscriptions and enforce plan limits.',
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
        'Pingram — in-app notifications, mobile push, optional SMS, and transactional email (including team invites and Support form delivery).',
        'RevenueCat — subscription entitlements and billing sync for clinic plans.',
        'Apple — Sign in with Apple, and App Store in-app purchases on iOS.',
        'Google — Sign in with Google when you choose that option.',
        'Stripe — payment processing for web billing.',
        'Vercel Analytics — anonymous website usage on our web app only.',
      ],
    },
    {
      title: 'Sharing',
      paragraphs: [
        'We do not sell your personal information. We share information only as needed to operate the service:',
      ],
      bullets: [
        'Between clinics (including assigned group managers) and workers when you apply, message, appear in Discover or outreach workflows, or participate in hiring.',
        'Within a group organization so owners and assigned managers can run hiring for their locations.',
        'With service providers listed above.',
        'When required by law or to protect rights, safety, and security.',
      ],
    },
    {
      title: 'Retention and account deletion',
      paragraphs: [
        'You can delete your account from Profile → Account in the app.',
        'When a worker or clinic owner deletes their account, we remove the login, profile, and uploaded files such as photos, resumes, and logos. For clinic owners, the organization, locations, memberships, and invites are removed, and live postings are closed.',
        'When an invited group manager deletes their account, their membership and location access are removed. The group organization and its postings remain under the owner’s account.',
        'Some historical application and message records may remain visible to the other party as needed for hiring context, marked as no longer on Chairside. Personal details in those records are removed or masked where possible (for example, message bodies from the deleted account may be replaced with a removed placeholder). Clinic-side private notes tied to a deleted worker profile are removed with that profile.',
        'Apple, Stripe, and RevenueCat may retain billing records according to their own policies and applicable law.',
        'We retain other data only as long as needed for the purposes above, unless a longer period is required by law. Support emails delivered to our inbox may be retained outside the app to handle your request.',
      ],
    },
    {
      title: 'Your choices',
      bullets: [
        'Update profile and notification preferences in the app.',
        'Opt out of push notifications per category under Profile → Notifications, or disable push at the device level.',
        'Opt in or out of fill-in SMS alerts in the app. SMS is only sent with your explicit consent.',
        'Delete your account at any time from Profile → Account.',
        'Contact us through the Support page to request access, correction, or deletion help.',
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
        'Chairside is intended for working dental professionals and authorized clinic hiring contacts who are at least 18 years old. It is not directed to children, and we do not knowingly collect information from anyone under 18.',
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
