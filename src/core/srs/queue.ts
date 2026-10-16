/**
 * Construction de la file de révision du jour à partir des notes (contenu) et des états de cartes (base locale).
 * Chaque note donne deux cartes : reconnaissance (italien → français) puis production (français → italien).
 * La carte de production n'apparaît qu'une fois la reconnaissance acquise, pour ne pas montrer
 * les deux faces d'une même note le même jour.
 */
import { levelPriority } from '../cefr.ts';
import type { Level } from '../cefr.ts';
import type { CardState } from './scheduler.ts';

export type Direction = 'rec' | 'prod';

export interface StudyNote {
  id: string;
  level: Level;
  it: string;
  fr: string;
  example?: string;
  exampleFr?: string;
}

export interface QueueItem {
  cardId: string;
  note: StudyNote;
  direction: Direction;
  /** `null` pour une carte jamais vue. */
  state: CardState | null;
}

export interface QueueInput {
  notes: readonly StudyNote[];
  states: ReadonlyMap<string, CardState>;
  now: number;
  level: Level;
  newLimit: number;
  newSeenToday: number;
}

export interface Queue {
  learning: QueueItem[];
  review: QueueItem[];
  fresh: QueueItem[];
}

export function cardId(noteId: string, direction: Direction): string {
  return `${noteId}::${direction}`;
}

export function parseCardId(id: string): { noteId: string; direction: Direction } | null {
  const sep = id.lastIndexOf('::');
  if (sep < 0) return null;
  const direction = id.slice(sep + 2);
  if (direction !== 'rec' && direction !== 'prod') return null;
  return { noteId: id.slice(0, sep), direction };
}

export function buildQueue(input: QueueInput): Queue {
  const { notes, states, now, level } = input;
  const noteById = new Map(notes.map((note) => [note.id, note]));
  const learning: QueueItem[] = [];
  const review: QueueItem[] = [];

  for (const state of states.values()) {
    if (state.phase === 'new' || state.due > now) continue;
    const parsed = parseCardId(state.id);
    const note = parsed && noteById.get(parsed.noteId);
    if (!parsed || !note) continue; // carte orpheline : sa note a été retirée du contenu
    const item: QueueItem = { cardId: state.id, note, direction: parsed.direction, state };
    (state.phase === 'review' ? review : learning).push(item);
  }
  learning.sort((a, b) => a.state!.due - b.state!.due);
  review.sort((a, b) => a.state!.due - b.state!.due);

  const budget = Math.max(0, input.newLimit - input.newSeenToday);
  const fresh: QueueItem[] = [];
  const candidates = notes
    .map((note, order) => ({ note, order, priority: levelPriority(note.level, level) }))
    .filter((c) => Number.isFinite(c.priority))
    .sort((a, b) => a.priority - b.priority || a.order - b.order);

  for (const { note } of candidates) {
    if (fresh.length >= budget) break;
    const recId = cardId(note.id, 'rec');
    const rec = states.get(recId);
    if (!rec || rec.phase === 'new') {
      fresh.push({ cardId: recId, note, direction: 'rec', state: rec ?? null });
      continue;
    }
    const prodId = cardId(note.id, 'prod');
    const prod = states.get(prodId);
    if (rec.phase === 'review' && (!prod || prod.phase === 'new')) {
      fresh.push({ cardId: prodId, note, direction: 'prod', state: prod ?? null });
    }
  }

  return { learning, review, fresh };
}

/** Ordre de présentation d'une séance : cartes en apprentissage, puis révisions, puis nouvelles. */
export function sessionOrder(queue: Queue): QueueItem[] {
  return [...queue.learning, ...queue.review, ...queue.fresh];
}
