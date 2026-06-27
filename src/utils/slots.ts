export function generateTimeSlots(gapMinutes: number): string[] {
  const slots: string[] = [];

  const formatTime = (totalMinutes: number) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  // Morning: 10:00 to 12:00 -> 600 minutes to 720 minutes
  let current = 10 * 60;
  const morningEnd = 12 * 60;
  while (current + gapMinutes <= morningEnd) {
    slots.push(`${formatTime(current)} - ${formatTime(current + gapMinutes)}`);
    current += gapMinutes;
  }

  // Evening: 18:00 to 20:00 -> 1080 minutes to 1200 minutes
  current = 18 * 60;
  const eveningEnd = 20 * 60;
  while (current + gapMinutes <= eveningEnd) {
    slots.push(`${formatTime(current)} - ${formatTime(current + gapMinutes)}`);
    current += gapMinutes;
  }

  return slots;
}
