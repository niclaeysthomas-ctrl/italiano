export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Comme dans Anki, une journée d'étude bascule à 4 h du matin (heure locale). */
export const ROLLOVER_HOUR = 4;

const pad = (n: number) => String(n).padStart(2, '0');

function formatDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Jour d'étude au format AAAA-MM-JJ pour l'horodatage donné. */
export function studyDay(ts: number = Date.now()): string {
  return formatDay(new Date(ts - ROLLOVER_HOUR * HOUR));
}

export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  const date = parseDay(day);
  date.setDate(date.getDate() + n);
  return formatDay(date);
}

/** Horodatage du début d'un jour d'étude (4 h du matin, heure locale). */
export function dayStart(day: string): number {
  const date = parseDay(day);
  date.setHours(ROLLOVER_HOUR, 0, 0, 0);
  return date.getTime();
}

/**
 * Nombre de jours consécutifs d'activité se terminant aujourd'hui.
 * Si rien n'a encore été fait aujourd'hui, la série d'hier reste valable jusqu'à la bascule.
 */
export function computeStreak(activeDays: Iterable<string>, today: string): number {
  const days = new Set(activeDays);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Les `n` derniers jours d'étude, du plus ancien au plus récent. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}
