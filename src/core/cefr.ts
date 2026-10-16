/** Niveaux du Cadre européen commun de référence couverts par l'application. */
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export type Level = (typeof LEVELS)[number];

/** Appellations officielles françaises des niveaux du CECRL. */
export const LEVEL_NAMES: Record<Level, string> = {
  A1: 'Découverte',
  A2: 'Survie',
  B1: 'Seuil',
  B2: 'Avancé',
  C1: 'Autonome',
};

export function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && (LEVELS as readonly string[]).includes(value);
}

export function levelIndex(level: Level): number {
  return LEVELS.indexOf(level);
}

/** Distance de priorité : le niveau courant d'abord, puis les niveaux inférieurs du plus proche au plus lointain. */
export function levelPriority(item: Level, current: Level): number {
  const diff = levelIndex(current) - levelIndex(item);
  return diff < 0 ? Number.POSITIVE_INFINITY : diff;
}
