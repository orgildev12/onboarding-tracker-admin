const pad = (value: number): string => (value < 10 ? `0${value}` : String(value));

// 'yyyy-mm-dd' as a local calendar day (new Date('yyyy-mm-dd') would be UTC midnight)
export function parseDay(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return undefined;
  }
  const day = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(day.getTime()) ? undefined : day;
}

export const toInputDate = (day: Date): string => `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;

export const formatDay = (day: Date): string => `${day.getFullYear()}.${pad(day.getMonth() + 1)}.${pad(day.getDate())}`;

const isWeekend = (day: Date): boolean => day.getDay() === 0 || day.getDay() === 6;

// Nth (1-based) Mon–Fri day counted from `start`; when start is a weekend, day 1 is the next Monday.
export function nthWorkingDay(start: Date, n: number): Date {
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (isWeekend(day)) {
    day.setDate(day.getDate() + 1);
  }
  for (let counted = 1; counted < n; counted++) {
    do {
      day.setDate(day.getDate() + 1);
    } while (isWeekend(day));
  }
  return day;
}

// start + 3 months (clamped to the month end), Saturday -> +2 days, Sunday -> +1 day
export function probationEndDate(start: Date): Date {
  const target = new Date(start.getFullYear(), start.getMonth() + 3, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(start.getDate(), lastDay));
  if (target.getDay() === 6) {
    target.setDate(target.getDate() + 2);
  } else if (target.getDay() === 0) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}
