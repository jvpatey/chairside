import { assert, assertEquals } from 'jsr:@std/assert@1';
import { gsmLength, SMS_SEGMENT_LIMIT, toGsmSafeSms } from './sms.ts';
import {
  computePingramSignature,
  outcomeReply,
  parseSmsReply,
  selectOffer,
  SMS_REPLY_COPY,
  verifyPingramSignature,
  WEBHOOK_TOLERANCE_MS,
} from './smsReply.ts';

const SECRET = 'pingram_whsecret_test';
const ID = 'trk_123';
const BODY = '{"eventType":"SMS_INBOUND","from":"+19025550000","text":"YES 4821"}';
const NOW = 1_790_000_000_000;

async function signed(overrides: Partial<Parameters<typeof verifyPingramSignature>[0]> = {}) {
  const timestamp = String(NOW);
  const signature = `v1,${await computePingramSignature(SECRET, ID, timestamp, BODY)}`;
  return verifyPingramSignature({
    secret: SECRET,
    id: ID,
    timestamp,
    signature,
    rawBody: BODY,
    nowMs: NOW,
    ...overrides,
  });
}

Deno.test('verifyPingramSignature accepts a valid v1 signature', async () => {
  assert(await signed());
});

Deno.test('verifyPingramSignature rejects tampering, wrong secret and missing headers', async () => {
  assertEquals(await signed({ rawBody: BODY.replace('4821', '1111') }), false);
  assertEquals(await signed({ secret: 'pingram_whsecret_other' }), false);
  assertEquals(await signed({ id: 'trk_other' }), false);
  assertEquals(await signed({ signature: null }), false);
  assertEquals(await signed({ signature: 'v0,abc' }), false);
});

Deno.test('verifyPingramSignature rejects stale timestamps', async () => {
  assertEquals(await signed({ nowMs: NOW + WEBHOOK_TOLERANCE_MS + 1 }), false);
  assertEquals(await signed({ nowMs: NOW - WEBHOOK_TOLERANCE_MS - 1 }), false);
});

Deno.test('parseSmsReply understands YES with or without a code', () => {
  assertEquals(parseSmsReply('YES 4821'), { kind: 'yes', code: '4821' });
  assertEquals(parseSmsReply('  yes, 4821!'), { kind: 'yes', code: '4821' });
  assertEquals(parseSmsReply('4821 yes'), { kind: 'yes', code: '4821' });
  assertEquals(parseSmsReply('Y'), { kind: 'yes', code: null });
  assertEquals(parseSmsReply('Yes please'), { kind: 'yes', code: null });
});

Deno.test('parseSmsReply handles HELP and unknown text', () => {
  assertEquals(parseSmsReply('help'), { kind: 'help' });
  assertEquals(parseSmsReply('Info'), { kind: 'help' });
  assertEquals(parseSmsReply('Thanks!'), { kind: 'unknown' });
  assertEquals(parseSmsReply('yesterday works'), { kind: 'unknown' });
  assertEquals(parseSmsReply(''), { kind: 'unknown' });
});

const offerA = { id: 'a', code: '4821', shift_post_id: 'shift-a' };
const offerB = { id: 'b', code: '1234', shift_post_id: 'shift-b' };

Deno.test('selectOffer matches by code', () => {
  assertEquals(selectOffer([offerA, offerB], '1234'), { kind: 'match', offer: offerB });
  assertEquals(selectOffer([offerA, offerB], '9999'), { kind: 'code_not_found' });
});

Deno.test('selectOffer only accepts a bare YES with exactly one open offer', () => {
  assertEquals(selectOffer([offerA], null), { kind: 'match', offer: offerA });
  assertEquals(selectOffer([offerA, offerB], null), { kind: 'ambiguous' });
  assertEquals(selectOffer([], null), { kind: 'none' });
  assertEquals(selectOffer([], '4821'), { kind: 'none' });
});

Deno.test('all reply copy is GSM-7 and fits one segment', () => {
  const replies = [
    ...Object.values(SMS_REPLY_COPY),
    ...(['requested', 'already_requested', 'already_confirmed', 'shift_unavailable', 'not_eligible'] as const)
      .map((outcome) => outcomeReply(outcome, 'Harbourfront Family & Cosmetic Dentistry')),
  ];
  for (const reply of replies) {
    assertEquals(toGsmSafeSms(reply), reply, reply);
    assert(gsmLength(reply) <= SMS_SEGMENT_LIMIT, `${gsmLength(reply)}: ${reply}`);
  }
});
