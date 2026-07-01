const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_PINGRAM_API_URL = 'https://api.ca.pingram.io';
const PINGRAM_SUPPORT_TYPE = 'support_contact';

const ALLOWED_SUBJECTS = new Set([
  'Bug Report',
  'Feature Request',
  'Account Issue',
  'General Question',
  'Other',
]);

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 5000;

type SupportContactBody = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  website?: string;
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildSupportEmailHtml(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const safeMessage = escapeHtml(input.message).replace(/\n/g, '<br>');
  const sentAt = new Date().toLocaleString('en-CA', { timeZone: 'America/Halifax' });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a6fd4;">New Chairside support request</h2>
      <div style="background-color: #f4f8fc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>From:</strong> ${escapeHtml(input.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
      </div>
      <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #374151;">Message</h3>
        <p style="line-height: 1.6; color: #4b5563;">${safeMessage}</p>
      </div>
      <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; font-size: 14px; color: #6b7280;">
        <p><strong>Reply to:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Sent from:</strong> Chairside Support form</p>
        <p><strong>Time:</strong> ${escapeHtml(sentAt)}</p>
      </div>
    </div>
  `.trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as SupportContactBody;

    if (body.website?.trim()) {
      return jsonResponse({ error: 'Invalid submission' }, 400);
    }

    const name = body.name?.trim() ?? '';
    const email = body.email?.trim() ?? '';
    const subject = body.subject?.trim() ?? '';
    const message = body.message?.trim() ?? '';

    if (!name || !email || !subject || !message) {
      return jsonResponse({ error: 'All fields are required' }, 400);
    }

    if (
      name.length > MAX_NAME_LENGTH ||
      email.length > MAX_EMAIL_LENGTH ||
      subject.length > MAX_SUBJECT_LENGTH ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return jsonResponse({ error: 'One or more fields are too long' }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: 'Please enter a valid email address' }, 400);
    }

    if (!ALLOWED_SUBJECTS.has(subject)) {
      return jsonResponse({ error: 'Please select a valid subject' }, 400);
    }

    const pingramApiKey = Deno.env.get('PINGRAM_API_KEY');
    const pingramApiUrl = Deno.env.get('PINGRAM_API_URL') ?? DEFAULT_PINGRAM_API_URL;
    const inboxEmail = Deno.env.get('SUPPORT_INBOX_EMAIL');
    const senderEmail = Deno.env.get('SUPPORT_SENDER_EMAIL') ?? 'noreply@pingram.io';
    const senderName = Deno.env.get('SUPPORT_SENDER_NAME') ?? 'Chairside Support';

    if (!pingramApiKey) {
      console.error('[support-contact] PINGRAM_API_KEY is not configured');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    if (!inboxEmail) {
      console.error('[support-contact] SUPPORT_INBOX_EMAIL is not configured');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    const pingramRes = await fetch(`${pingramApiUrl.replace(/\/$/, '')}/email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pingramApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: PINGRAM_SUPPORT_TYPE,
        to: inboxEmail,
        subject: `Chairside Support: ${subject}`,
        html: buildSupportEmailHtml({ name, email, subject, message }),
        fromName: senderName,
        fromAddress: senderEmail,
        replyToAddresses: [email],
      }),
    });

    if (!pingramRes.ok) {
      const text = await pingramRes.text();
      console.error('[support-contact] Pingram email failed', pingramRes.status, text);
      return jsonResponse({ error: 'Failed to send message. Please try again.' }, 500);
    }

    return jsonResponse({ message: 'Message sent successfully!' }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[support-contact]', message);
    return jsonResponse({ error: 'An unexpected error occurred. Please try again.' }, 500);
  }
});
