/**
 * Objectif quotidien, activité par jour et suggestion de passage au niveau supérieur.
 */
import { LEVELS, levelIndex } from '../cefr.ts';
import type { Level } from '../cefr.ts';

/** Points d'activité : une réponse à une carte vaut 1, un exercice terminé vaut 5. */
export const POINTS_PER_REVIEW = 1;
export const POINTS_PER_EXERCISE = 5;

export const GOAL_OPTIONS = [15, 30, 50, 80] as const;

export function activityByDay(reviewDays: readonly string[], attemptDays: readonly string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const day of reviewDays) map.set(day, (map.get(day) ?? 0) + POINTS_PER_REVIEW);
  for (const day of attemptDays) map.set(day, (map.get(day) ?? 0) + POINTS_PER_EXERCISE);
  return map;
}

export interface LevelEvidence {
  level: Level;
  /** Notes (mots) du niveau dans le contenu. */
  notesTotal: number;
  /** Notes du niveau dont la carte de reconnaissance est acquise (phase « révision »). */
  notesLearned: number;
  lessonsTotal: number;
  /** Leçons du niveau réussies au moins une fois (score ≥ 70). */
  lessonsPassed: number;
  /** Scores des exercices des 30 derniers jours. */
  recentScores: readonly number[];
}

export interface LevelReadiness {
  vocab: number;
  grammar: number;
  /** Moyenne des exercices récents, `null` s'il y en a trop peu. */
  exercises: number | null;
  ready: boolean;
  next: Level | null;
}

export const THRESHOLDS = { vocab: 0.7, grammar: 0.7, exercises: 75, minExercises: 5 };

/** Le niveau suivant est suggéré quand le vocabulaire et la grammaire du niveau sont acquis et les exercices réussis. */
export function levelReadiness(e: LevelEvidence): LevelReadiness {
  const vocab = e.notesTotal ? e.notesLearned / e.notesTotal : 0;
  const grammar = e.lessonsTotal ? e.lessonsPassed / e.lessonsTotal : 1;
  const exercises =
    e.recentScores.length >= THRESHOLDS.minExercises ? e.recentScores.reduce((a, b) => a + b, 0) / e.recentScores.length : null;
  const index = levelIndex(e.level);
  const next = index < LEVELS.length - 1 ? LEVELS[index + 1] : null;
  const ready =
    next !== null &&
    vocab >= THRESHOLDS.vocab &&
    grammar >= THRESHOLDS.grammar &&
    exercises !== null &&
    exercises >= THRESHOLDS.exercises;
  return { vocab, grammar, exercises, ready, next };
}

/** Grille du calendrier d'activité : `weeks` colonnes de 7 jours se terminant aujourd'hui (lundi en haut). */
export function calendarGrid(today: string, weeks: number, addDays: (day: string, n: number) => string, weekday: (day: string) => number): (string | null)[][] {
  // weekday : 0 = lundi … 6 = dimanche
  const offset = weekday(today);
  const lastMonday = addDays(today, -offset);
  const firstMonday = addDays(lastMonday, -7 * (weeks - 1));
  const columns: (string | null)[][] = [];
  for (let w = 0; w < weeks; w++) {
    const column: (string | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(firstMonday, w * 7 + d);
      column.push(w === weeks - 1 && d > offset ? null : day);
    }
    columns.push(column);
  }
  return columns;
}
