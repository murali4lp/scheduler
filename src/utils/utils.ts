// Helper: Check if time is valid (hour mark, ISO string)
export function isHourMark(time: string): boolean {
  const date = new Date(time);
  return date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0;
}