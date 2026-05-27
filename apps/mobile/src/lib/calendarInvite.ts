import * as Calendar from 'expo-calendar';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

export type InterviewInviteInput = {
  title: string;
  clinicName: string;
  roleTitle: string;
  interviewAt: Date;
  durationMinutes: number;
  details?: string | null;
  location?: string | null;
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** UTC timestamp for Google Calendar / ICS: YYYYMMDDTHHmmssZ */
function formatUtcCompact(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').slice(0, 64) || 'interview';
}

function buildDescriptionPlain(input: InterviewInviteInput): string {
  return [
    `Interview for ${input.roleTitle} at ${input.clinicName}.`,
    input.details?.trim(),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildGoogleCalendarUrl(input: InterviewInviteInput): string {
  const end = new Date(input.interviewAt.getTime() + input.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${formatUtcCompact(input.interviewAt)}/${formatUtcCompact(end)}`,
  });

  const details = buildDescriptionPlain(input);
  if (details) {
    params.set('details', details);
  }

  if (input.location?.trim()) {
    params.set('location', input.location.trim());
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildInterviewIcsContent(input: InterviewInviteInput): string {
  const end = new Date(input.interviewAt.getTime() + input.durationMinutes * 60_000);
  const uid = `${input.interviewAt.getTime()}-interview@chairside.app`;
  const description = buildDescriptionPlain(input);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chairside//Interview Invite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatUtcCompact(new Date())}`,
    `DTSTART:${formatUtcCompact(input.interviewAt)}`,
    `DTEND:${formatUtcCompact(end)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : null,
    input.location?.trim() ? `LOCATION:${escapeIcsText(input.location.trim())}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

async function writeInterviewIcsFile(input: InterviewInviteInput): Promise<string> {
  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) {
    throw new Error('Device cache is unavailable');
  }

  const localUri = `${cacheDirectory}${sanitizeFileName(input.title)}-${Date.now()}.ics`;
  await FileSystem.writeAsStringAsync(localUri, buildInterviewIcsContent(input), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const info = await FileSystem.getInfoAsync(localUri);
  if (!info.exists) {
    throw new Error('Could not create calendar invite');
  }

  return localUri;
}

function buildCalendarEventData(input: InterviewInviteInput) {
  const end = new Date(input.interviewAt.getTime() + input.durationMinutes * 60_000);

  return {
    title: input.title,
    startDate: input.interviewAt,
    endDate: end,
    location: input.location?.trim() || undefined,
    notes: buildDescriptionPlain(input) || undefined,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/** Opens the native OS calendar UI to add the interview event. */
export async function addInterviewToCalendar(input: InterviewInviteInput): Promise<void> {
  try {
    await Calendar.createEventInCalendarAsync(buildCalendarEventData(input));
  } catch {
    if (Platform.OS === 'android') {
      const googleUrl = buildGoogleCalendarUrl(input);
      try {
        await Linking.openURL(googleUrl);
        return;
      } catch {
        // Fall through to ICS share.
      }
    }

    await shareInterviewIcsFile(input);
  }
}

async function shareInterviewIcsFile(input: InterviewInviteInput): Promise<void> {
  const localUri = await writeInterviewIcsFile(input);
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Calendar sharing is not available on this device');
  }

  await Sharing.shareAsync(localUri, {
    mimeType: 'text/calendar',
    UTI: 'public.calendar-event',
    dialogTitle: input.title,
  });
}

/** Opens the system calendar flow — native add-event UI, with ICS / Google fallbacks. */
export async function openInterviewCalendarInvite(input: InterviewInviteInput): Promise<void> {
  await addInterviewToCalendar(input);
}

/** @deprecated Use addInterviewToCalendar */
export async function shareInterviewInviteExternally(input: InterviewInviteInput): Promise<void> {
  await addInterviewToCalendar(input);
}

export function buildInterviewShareMessage(input: InterviewInviteInput): string {
  const formattedDate = input.interviewAt.toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const lines = [
    `Interview for ${input.roleTitle} at ${input.clinicName}`,
    formattedDate,
  ];

  if (input.location?.trim()) {
    lines.push(input.location.trim());
  }
  if (input.details?.trim()) {
    lines.push(input.details.trim());
  }

  if (Platform.OS !== 'ios') {
    lines.push(`Add to calendar: ${buildGoogleCalendarUrl(input)}`);
  } else {
    lines.push('Use the calendar invite file to add this to your calendar.');
  }

  return lines.join('\n\n');
}

export function buildInterviewInviteTitle(input: Pick<InterviewInviteInput, 'clinicName' | 'roleTitle'>) {
  return `Interview · ${input.roleTitle} · ${input.clinicName}`;
}

export function buildInterviewInviteInputFromApplication(options: {
  clinicName: string;
  roleTitle: string;
  interviewAt: string;
  durationMinutes?: number | null;
  details?: string | null;
}): InterviewInviteInput | null {
  const interviewAt = new Date(options.interviewAt);
  if (Number.isNaN(interviewAt.getTime())) return null;

  const title = buildInterviewInviteTitle({
    clinicName: options.clinicName,
    roleTitle: options.roleTitle,
  });

  return {
    title,
    clinicName: options.clinicName,
    roleTitle: options.roleTitle,
    interviewAt,
    durationMinutes: options.durationMinutes ?? 45,
    details: options.details,
  };
}
