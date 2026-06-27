export interface SlotConfig {
  morningStart?: string;
  morningEnd?: string;
  morningEnabled?: boolean;
  eveningStart?: string;
  eveningEnd?: string;
  eveningEnabled?: boolean;
}

export function generateTimeSlots(gapMinutes: number, config: SlotConfig = {}): string[] {
  const slots: string[] = [];

  const formatTime = (totalMinutes: number) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    const [hrs, mins] = timeStr.split(":").map(Number);
    return hrs * 60 + mins;
  };

  const morningEnabled = config.morningEnabled !== false;
  if (morningEnabled) {
    const startStr = config.morningStart || "10:00";
    const endStr = config.morningEnd || "12:00";
    try {
      let current = parseTimeToMinutes(startStr);
      const morningEnd = parseTimeToMinutes(endStr);
      while (current + gapMinutes <= morningEnd) {
        slots.push(`${formatTime(current)} - ${formatTime(current + gapMinutes)}`);
        current += gapMinutes;
      }
    } catch (e) {
      console.error("Error parsing morning time slots:", e);
    }
  }

  const eveningEnabled = config.eveningEnabled !== false;
  if (eveningEnabled) {
    const startStr = config.eveningStart || "18:00";
    const endStr = config.eveningEnd || "20:00";
    try {
      let current = parseTimeToMinutes(startStr);
      const eveningEnd = parseTimeToMinutes(endStr);
      while (current + gapMinutes <= eveningEnd) {
        slots.push(`${formatTime(current)} - ${formatTime(current + gapMinutes)}`);
        current += gapMinutes;
      }
    } catch (e) {
      console.error("Error parsing evening time slots:", e);
    }
  }

  return slots;
}

