const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// "7 минутын өмнө", "2 цагийн өмнө", "7 өдрийн өмнө"
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - date.getTime());
  if (diff < MINUTE) {
    return 'Дөнгөж сая';
  }
  if (diff < HOUR) {
    return `${Math.floor(diff / MINUTE)} минутын өмнө`;
  }
  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)} цагийн өмнө`;
  }
  if (diff < 30 * DAY) {
    return `${Math.floor(diff / DAY)} өдрийн өмнө`;
  }
  if (diff < 365 * DAY) {
    return `${Math.floor(diff / (30 * DAY))} сарын өмнө`;
  }
  return `${Math.floor(diff / (365 * DAY))} жилийн өмнө`;
}
