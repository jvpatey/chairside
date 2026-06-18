export function isUrgentOutreachShift(shiftDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${shiftDate}T12:00:00`);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays <= 1;
}
