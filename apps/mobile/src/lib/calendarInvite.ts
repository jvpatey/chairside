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

export function buildGoogleCalendarUrl(input: InterviewInviteInput): string {
  const end = new Date(input.interviewAt.getTime() + input.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${formatUtcCompact(input.interviewAt)}/${formatUtcCompact(end)}`,
  });

  const detailsParts = [
    `Interview for ${input.roleTitle} at ${input.clinicName}.`,
    input.details?.trim(),
  ].filter(Boolean);

  if (detailsParts.length > 0) {
    params.set('details', detailsParts.join('\n\n'));
  }

  if (input.location?.trim()) {
    params.set('location', input.location.trim());
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildInterviewIcsContent(input: InterviewInviteInput): string {
  const end = new Date(input.interviewAt.getTime() + input.durationMinutes * 60_000);
  const uid = `${input.interviewAt.getTime()}-interview@chairside.app`;
  const description = [
    `Interview for ${input.roleTitle} at ${input.clinicName}.`,
    input.details?.trim(),
  ]
    .filter(Boolean)
    .join('\\n\\n');

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
    description ? `DESCRIPTION:${escapeIcsText(description.replace(/\\n\\n/g, '\n\n'))}` : null,
    input.location?.trim() ? `LOCATION:${escapeIcsText(input.location.trim())}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
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
  const calendarUrl = buildGoogleCalendarUrl(input);

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

  lines.push(`Add to calendar: ${calendarUrl}`);

  return lines.join('\n\n');
}

export function buildInterviewInviteTitle(input: Pick<InterviewInviteInput, 'clinicName' | 'roleTitle'>) {
  return `Interview · ${input.roleTitle} · ${input.clinicName}`;
}
