/**
 * Test de niveau adaptatif.
 *
 * Le test commence à un niveau de départ (A2 par défaut) et pose un bloc de questions par niveau.
 * - Bloc maîtrisé (≥ 75 %) : on monte d'un niveau, tant que le niveau supérieur n'a pas été testé.
 * - Bloc raté (< 50 %) : on descend d'un niveau, s'il n'a pas encore été testé.
 * - Entre les deux : on s'arrête, c'est le niveau à travailler.
 * Le niveau recommandé est le premier niveau non maîtrisé : c'est là que l'apprentissage commence.
 */
import { LEVELS, levelIndex } from '../cefr.ts';
import type { Level } from '../cefr.ts';
import { shuffle } from '../random.ts';
import type { Rng } from '../random.ts';

export interface PlacementItem {
  id: string;
  level: Level;
  skill?: string;
}

export interface PlacementConfig {
  perLevel: number;
  startLevel: Level;
  mastery: number;
  floor: number;
}

export const DEFAULT_PLACEMENT: PlacementConfig = { perLevel: 4, startLevel: 'A2', mastery: 0.75, floor: 0.5 };

export interface LevelScore {
  correct: number;
  total: number;
}

export interface PlacementState {
  level: Level;
  block: string[];
  position: number;
  scores: Partial<Record<Level, LevelScore>>;
  history: { id: string; level: Level; correct: boolean }[];
  done: boolean;
  recommended: Level | null;
}

export function startPlacement(bank: readonly PlacementItem[], rng: Rng, cfg: PlacementConfig = DEFAULT_PLACEMENT): PlacementState {
  const state: PlacementState = { level: cfg.startLevel, block: [], position: 0, scores: {}, history: [], done: false, recommended: null };
  return enterLevel(state, cfg.startLevel, bank, rng, cfg);
}

export function currentQuestionId(state: PlacementState): string | null {
  if (state.done) return null;
  return state.block[state.position] ?? null;
}

export function answerPlacement(
  state: PlacementState,
  bank: readonly PlacementItem[],
  correct: boolean,
  rng: Rng,
  cfg: PlacementConfig = DEFAULT_PLACEMENT,
): PlacementState {
  const id = currentQuestionId(state);
  if (!id) return state;

  const previous = state.scores[state.level] ?? { correct: 0, total: 0 };
  const next: PlacementState = {
    ...state,
    position: state.position + 1,
    scores: { ...state.scores, [state.level]: { correct: previous.correct + (correct ? 1 : 0), total: previous.total + 1 } },
    history: [...state.history, { id, level: state.level, correct }],
  };
  if (next.position < next.block.length) return next;

  const decision = decide(next.level, next.scores, cfg);
  if (decision.done) return { ...next, done: true, recommended: decision.level };
  return enterLevel(next, decision.level, bank, rng, cfg);
}

function rate(score: LevelScore | undefined): number | undefined {
  return score && score.total > 0 ? score.correct / score.total : undefined;
}

function decide(level: Level, scores: PlacementState['scores'], cfg: PlacementConfig): { done: boolean; level: Level } {
  const index = levelIndex(level);
  const current = rate(scores[level]) ?? 0;

  if (current >= cfg.mastery) {
    if (index === LEVELS.length - 1) return { done: true, level };
    const up = LEVELS[index + 1];
    // Niveau supérieur déjà testé (et donc non maîtrisé) : c'est lui qu'il faut travailler.
    return rate(scores[up]) === undefined ? { done: false, level: up } : { done: true, level: up };
  }
  if (current < cfg.floor && index > 0) {
    const down = LEVELS[index - 1];
    if (rate(scores[down]) === undefined) return { done: false, level: down };
  }
  return { done: true, level };
}

function enterLevel(state: PlacementState, level: Level, bank: readonly PlacementItem[], rng: Rng, cfg: PlacementConfig): PlacementState {
  const asked = new Set(state.history.map((h) => h.id));
  const block = buildBlock(level, bank, asked, rng, cfg.perLevel);
  if (block.length === 0) return { ...state, level, block, position: 0, done: true, recommended: level };
  return { ...state, level, block, position: 0 };
}

/** Tire un bloc de questions pour un niveau, avec au moins une question d'écoute si possible. */
export function buildBlock(level: Level, bank: readonly PlacementItem[], asked: ReadonlySet<string>, rng: Rng, size: number): string[] {
  const candidates = shuffle(bank.filter((q) => q.level === level && !asked.has(q.id)), rng);
  const listening = candidates.find((q) => q.skill === 'listening');
  const picked = listening ? [listening] : [];
  for (const q of candidates) {
    if (picked.length >= size) break;
    if (q !== listening) picked.push(q);
  }
  return shuffle(picked, rng).map((q) => q.id);
}
