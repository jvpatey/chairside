import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  buildFillInSms,
  buildOutreachSms,
  formatSmsDate,
  formatSmsTimeRange,
  gsmLength,
  SMS_SEGMENT_LIMIT,
  SMS_TWO_SEGMENT_LIMIT,
  toGsmSafeSms,
} from './sms.ts';

const isGsmOnly = (text: string) => toGsmSafeSms(text) === text;

Deno.test('toGsmSafeSms strips accents', () => {
  assertEquals(toGsmSafeSms('Clinique Dentaire Élite'), 'Clinique Dentaire Elite');
  assertEquals(toGsmSafeSms('Montréal · Québec'), 'Montreal - Quebec');
});

Deno.test('toGsmSafeSms replaces dashes, quotes, ellipsis and drops emoji', () => {
  assertEquals(toGsmSafeSms('8 AM–4 PM'), '8 AM-4 PM');
  assertEquals(toGsmSafeSms('Smile—Co'), 'Smile-Co');
  assertEquals(toGsmSafeSms('Dr. O’Neil’s “Best” Dental…'), `Dr. O'Neil's "Best" Dental...`);
  assertEquals(toGsmSafeSms('Bright Smiles 😁 Dental'), 'Bright Smiles Dental');
});

Deno.test('gsmLength counts extension characters twice', () => {
  assertEquals(gsmLength('abc'), 3);
  assertEquals(gsmLength('€5 [x]'), 9);
});

Deno.test('SMS date and time formatters are ASCII and short', () => {
  assertEquals(formatSmsDate('2026-09-27'), 'Sep 27');
  assertEquals(formatSmsTimeRange('08:00:00', '16:30'), '8 AM-4:30 PM');
  assertEquals(formatSmsTimeRange(null, '16:00'), null);
});

Deno.test('fill-in SMS keeps everything when it fits one segment', () => {
  const sms = buildFillInSms({
    clinicName: 'Bayview Dental',
    locationLabel: 'Halifax, NS',
    shiftDate: '2026-09-27',
    startTime: '08:00',
    endTime: '16:00',
    compensation: '$45/hr',
  });
  assertEquals(
    sms,
    'Chairside: Bayview Dental (Halifax, NS) posted a fill-in for Sep 27, 8 AM-4 PM. Pay: $45/hr. Open Chairside to apply. Reply STOP to opt out.',
  );
  assert(gsmLength(sms) <= SMS_SEGMENT_LIMIT);
});

Deno.test('fill-in SMS drops location first, then compensation', () => {
  const base = {
    clinicName: 'Harbourfront Family & Cosmetic Dentistry',
    locationLabel: 'Dartmouth, Nova Scotia',
    shiftDate: '2026-09-27',
    startTime: '08:00',
    endTime: '16:00',
  };

  const withoutLocation = buildFillInSms({ ...base, compensation: '$45/hr' });
  assert(!withoutLocation.includes('Dartmouth'));
  assertStringIncludes(withoutLocation, 'Pay: $45/hr.');
  assert(gsmLength(withoutLocation) <= SMS_SEGMENT_LIMIT);

  const withoutPay = buildFillInSms({
    ...base,
    compensation: '$45-$55 per hour depending on experience',
  });
  assert(!withoutPay.includes('Dartmouth'));
  assert(!withoutPay.includes('Pay:'));
  assertStringIncludes(withoutPay, 'Harbourfront Family & Cosmetic Dentistry');
  assert(gsmLength(withoutPay) <= SMS_SEGMENT_LIMIT);
});

Deno.test('fill-in SMS always keeps brand, date and opt-out, and is GSM-only', () => {
  const sms = buildFillInSms({
    clinicName: 'Clinique Dentaire Élite du Grand Montréal – Centre-ville et Environs',
    locationLabel: 'Montréal, QC',
    shiftDate: '2026-09-27',
    startTime: '08:00',
    endTime: '16:00',
    compensation: '45 $/h',
    isUpdate: true,
  });
  assert(sms.startsWith('Chairside: Clinique Dentaire Elite'));
  assertStringIncludes(sms, 'updated a fill-in for Sep 27, 8 AM-4 PM.');
  assert(sms.endsWith('Reply STOP to opt out.'));
  assert(isGsmOnly(sms));
  assert(gsmLength(sms) <= SMS_SEGMENT_LIMIT);
});

Deno.test('fill-in SMS with a reply code swaps the call to action and still fits', () => {
  const sms = buildFillInSms({
    clinicName: 'Harbourfront Family & Cosmetic Dentistry',
    locationLabel: 'Dartmouth, NS',
    shiftDate: '2026-09-27',
    startTime: '08:00',
    endTime: '16:00',
    compensation: '$45/hr',
    replyCode: '4821',
  });
  assertStringIncludes(sms, 'Reply YES 4821 to request.');
  assert(!sms.includes('Open Chairside to apply.'));
  assert(sms.endsWith('Reply STOP to opt out.'));
  assert(gsmLength(sms) <= SMS_SEGMENT_LIMIT);
});

Deno.test('fill-in SMS with listing URL uses Apply CTA and may use two segments', () => {
  const listingUrl = 'https://chairside.app/f/11111111-2222-3333-4444-555555555555';
  const sms = buildFillInSms({
    clinicName: 'Bayview Dental',
    locationLabel: 'Halifax, NS',
    shiftDate: '2026-09-27',
    startTime: '08:00',
    endTime: '16:00',
    compensation: '$45/hr',
    listingUrl,
  });
  assertStringIncludes(sms, `Apply: ${listingUrl}`);
  assert(!sms.includes('Open Chairside to apply.'));
  assert(sms.endsWith('Reply STOP to opt out.'));
  assert(isGsmOnly(sms));
  assert(gsmLength(sms) <= SMS_TWO_SEGMENT_LIMIT);
});

Deno.test('fill-in SMS with listing URL uses Details CTA for sourced listings', () => {
  const listingUrl = 'https://chairside.app/f/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const sms = buildFillInSms({
    clinicName: 'Coastal Hygienists',
    locationLabel: 'Halifax, NS',
    shiftDate: '2026-09-27',
    startTime: '08:00',
    endTime: '16:00',
    listingUrl,
    listingCta: 'Details',
  });
  assertStringIncludes(sms, `Details: ${listingUrl}`);
  assert(!sms.includes('Apply:'));
  assert(gsmLength(sms) <= SMS_TWO_SEGMENT_LIMIT);
});

Deno.test('fill-in SMS reply code wins over listing URL', () => {
  const sms = buildFillInSms({
    clinicName: 'Bayview Dental',
    locationLabel: 'Halifax, NS',
    shiftDate: '2026-09-27',
    startTime: '08:00',
    endTime: '16:00',
    replyCode: '4821',
    listingUrl: 'https://chairside.app/f/11111111-2222-3333-4444-555555555555',
  });
  assertStringIncludes(sms, 'Reply YES 4821 to request.');
  assert(!sms.includes('chairside.app'));
  assert(gsmLength(sms) <= SMS_SEGMENT_LIMIT);
});

Deno.test('fill-in SMS handles missing shift date as schedule TBD', () => {
  const sms = buildFillInSms({
    clinicName: 'Bayview Dental',
    locationLabel: 'Halifax, NS',
    shiftDate: null,
    listingUrl: 'https://chairside.app/f/11111111-2222-3333-4444-555555555555',
    listingCta: 'Details',
  });
  assertStringIncludes(sms, 'fill-in for schedule TBD.');
  assert(gsmLength(sms) <= SMS_TWO_SEGMENT_LIMIT);
});

Deno.test('outreach SMS fits one segment with and without shift details', () => {
  const withShift = buildOutreachSms({
    clinicName: 'Bayview Dental',
    shiftDate: '2026-09-27',
    startTime: '08:00',
    endTime: '16:00',
  });
  assertEquals(
    withShift,
    'Chairside: Bayview Dental sent you a fill-in request for Sep 27, 8 AM-4 PM. Open Chairside to reply. Reply STOP to opt out.',
  );

  const noShift = buildOutreachSms({ clinicName: 'Bayview Dental' });
  assertEquals(
    noShift,
    'Chairside: Bayview Dental sent you a fill-in request. Open Chairside to reply. Reply STOP to opt out.',
  );
});
