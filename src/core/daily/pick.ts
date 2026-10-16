/**
 * Sélection déterministe du « contenu du jour » : le même jour et le même niveau
 * donnent toujours le même élément, sans rien stocker.
 */
import { LEVELS, levelIndex } from '../cefr.ts';
import type { Level } from '../cefr.ts';
import { hashString } from '../random.ts';

export interface Leveled {
  id: string;
  level: Level;
}

/** Candidats du niveau demandé ; à défaut, le niveau inférieur le plus proche, puis supérieur. */
export function candidatesFor<T extends Leveled>(items: readonly T[], level: Level): T[] {
  const index = levelIndex(level);
  const order = [...LEVELS].sort((a, b) => {
    const da = levelIndex(a) - index;
    const db = levelIndex(b) - index;
    const rank = (d: number) => (d <= 0 ? -d * 2 : d * 2 + 1);
    return rank(da) - rank(db);
  });
  for (const candidateLevel of order) {
    const found = items.filter((item) => item.level === candidateLevel);
    if (found.length > 0) return found;
  }
  return [];
}

export function pickDaily<T extends Leveled>(items: readonly T[], day: string, level: Level, salt = ''): T | undefined {
  const candidates = candidatesFor(items, level);
  if (candidates.length === 0) return undefined;
  return candidates[hashString(`${day}:${salt}`) % candidates.length];
}
