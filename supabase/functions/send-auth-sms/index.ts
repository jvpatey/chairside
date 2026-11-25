/**
 * Supabase Auth Send SMS hook → Pingram.
 * Delivers phone OTP codes. Does not use Twilio.
 *
 * Deploy with JWT verification off (Auth calls this before a session exists):
 *   supabase functions deploy send-auth-sms --no-verify-jwt --use-api
 *
 * Secrets: PINGRAM_API_KEY, SEND_SMS_HOOK_SECRET (v1,whsec_...), optional PINGRAM_API_URL
 */
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

import {
  DEFAULT_PINGRAM_API_URL,
  maskPhone,
  normalizeE164,
  pingramPost,
} from '../_shared/pingram.ts';
import { toGsmSafeSms } from '../_shared/sms.ts';

const AUTH_OTP_TYPE = 'auth_otp';

type SendSmsHookPayload = {
  user: {
    phone?: string | null;
    /** Pending number during phone_change / updateUser bind. */
    phone_change?: string | null;
    id?: string;
    identities?: Array<{ identity_data?: { phone?: string | null } | null }>;
  };
  sms: {
    otp?: string;
    /**
     * Number this OTP is for. On phone_change this is the *new* number;
     * `user.phone` may still be empty/old. Auth often omits the leading +.
     */
    phone?: string | null;
  };
};

function resolveHookPhone(payload: SendSmsHookPayload): string | null {
  const user = payload.user ?? {};
  const candidates = [
    payload.sms?.phone,
    user.phone_change,
    user.phone,
    ...(user.identities ?? []).map((identity) => identity.identity_data?.phone),
  ];
  for (const candidate of candidates) {
    const e164 = normalizeE164(candidate ?? null);
    if (e164) return e164;
  }
  return null;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function hookSecretBase64(): string | null {
  const raw = Deno.env.get('SEND_SMS_HOOK_SECRET')?.trim();
  if (!raw) return null;
  // Dashboard value looks like: v1,whsec_<base64>
  return raw.replace(/^v1,whsec_/, '');
}

function buildOtpMessage(otp: string): string {
  return toGsmSafeSms(`Chairside code: ${otp}. Expires in 1 minute.`);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const secret = hookSecretBase64();
  if (!secret) {
    console.error('[send-auth-sms] SEND_SMS_HOOK_SECRET is not set');
    return jsonResponse({ error: 'Hook secret not configured' }, 500);
  }

  const apiKey = Deno.env.get('PINGRAM_API_KEY')?.trim() ?? '';
  if (!apiKey) {
    console.error('[send-auth-sms] PINGRAM_API_KEY is not set');
    return jsonResponse({ error: 'Pingram not configured' }, 500);
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(secret);

  let verified: SendSmsHookPayload;
  try {
    verified = wh.verify(payload, headers) as SendSmsHookPayload;
  } catch (error) {
    console.error('[send-auth-sms] webhook verify failed', error);
    return jsonResponse({ error: 'Invalid hook signature' }, 401);
  }

  const otp = verified.sms?.otp?.trim() ?? '';
  if (!/^\d{4,8}$/.test(otp)) {
    console.error('[send-auth-sms] missing or invalid otp in payload', {
      smsKeys: verified.sms ? Object.keys(verified.sms) : null,
    });
    // Auth maps HTTP 400 → "Invalid payload sent to hook"; use 200 + error body.
    return jsonResponse({
      error: { http_code: 400, message: 'Invalid OTP payload from Auth' },
    });
  }

  const phoneE164 = resolveHookPhone(verified);
  if (!phoneE164) {
    console.error('[send-auth-sms] invalid phone in hook payload', {
      smsPhone: verified.sms?.phone,
      userPhone: verified.user?.phone,
      phoneChange: verified.user?.phone_change,
    });
    return jsonResponse({
      error: {
        http_code: 400,
        message: 'Could not read the phone number for this verification text.',
      },
    });
  }

  const apiBase = Deno.env.get('PINGRAM_API_URL')?.trim() || DEFAULT_PINGRAM_API_URL;

  try {
    const trackingId = await pingramPost(apiKey, apiBase, '/sms', {
      type: AUTH_OTP_TYPE,
      to: phoneE164,
      message: buildOtpMessage(otp),
    });
    console.log(
      `[send-auth-sms] sent type=${AUTH_OTP_TYPE} to=${maskPhone(phoneE164)} trackingId=${trackingId ?? 'none'}`,
    );
    return jsonResponse({});
  } catch (error) {
    console.error(`[send-auth-sms] Pingram send failed to=${maskPhone(phoneE164)}`, error);
    return jsonResponse(
      {
        error: {
          http_code: 500,
          message: error instanceof Error ? error.message : 'Failed to send SMS',
        },
      },
      500,
    );
  }
});
