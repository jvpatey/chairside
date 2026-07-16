/** First whitespace-separated token of a display name, for greetings. */
export function getFirstName(fullName?: string | null): string | null {
  const first = fullName?.trim().split(/\s+/).filter(Boolean)[0];
  return first || null;
}

export function getTimeOfDayGreeting(
  firstName?: string | null,
  date = new Date(),
): string {
  const hour = date.getHours();
  const base =
    hour >= 5 && hour < 12
      ? 'Good morning'
      : hour >= 12 && hour < 17
        ? 'Good afternoon'
        : 'Good evening';
  const name = firstName?.trim();
  return name ? `${base}, ${name}` : base;
}
