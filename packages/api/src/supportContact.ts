import { getSupabaseClient } from './client';

export const SUPPORT_CONTACT_SUBJECTS = [
  'Bug Report',
  'Feature Request',
  'Account Issue',
  'General Question',
  'Other',
] as const;

export type SupportContactSubject = (typeof SUPPORT_CONTACT_SUBJECTS)[number];

export type SubmitSupportContactInput = {
  name: string;
  email: string;
  subject: SupportContactSubject;
  message: string;
  /** Honeypot — must be empty. Web only. */
  website?: string;
};

export async function submitSupportContact(input: SubmitSupportContactInput): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('support-contact', {
    body: {
      name: input.name.trim(),
      email: input.email.trim(),
      subject: input.subject,
      message: input.message.trim(),
      website: input.website?.trim() || undefined,
    },
  });

  if (error) throw error;

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }
}
