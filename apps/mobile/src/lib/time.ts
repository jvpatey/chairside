export function formatTime12h(time: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours24 = Number(match[1]);
  const minutes = match[2];
  if (hours24 < 0 || hours24 > 23) return null;

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return minutes === '00' ? `${hours12} ${period}` : `${hours12}:${minutes} ${period}`;
}

export function formatTime24h(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseTime24h(value: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  const start = parseTime24h(startTime);
  const end = parseTime24h(endTime);
  if (!start || !end) return false;
  return start.getTime() < end.getTime();
}

export function formatTimeRangePreview(startTime: string, endTime: string): string | null {
  const start = formatTime12h(startTime);
  const end = formatTime12h(endTime);
  if (!start || !end) return null;
  return `${start} – ${end}`;
}
