import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQueue, cardId, parseCardId, sessionOrder } from './queue.ts';
import type { StudyNote } from './queue.ts';
import { newCardState } from './scheduler.ts';
import type { CardState } from './scheduler.ts';

const now = new Date(2026, 2, 1, 10, 0).getTime();

const notes: StudyNote[] = [
  { id: 'a1-1', level: 'A1', it: 'ciao', fr: 'salut' },
  { id: 'a1-2', level: 'A1', it: 'grazie', fr: 'merci' },
  { id: 'a2-1', level: 'A2', it: 'ieri', fr: 'hier' },
  { id: 'b1-1', level: 'B1', it: 'ormai', fr: 'désormais' },
];

function state(id: string, patch: Partial<CardState>): CardState {
  return { ...newCardState(id, now), ...patch };
}

test('les identifiants de carte se décodent', () => {
  assert.deepEqual(parseCardId(cardId('a1-1', 'prod')), { noteId: 'a1-1', direction: 'prod' });
  assert.equal(parseCardId('nimportequoi'), null);
});

test('les nouvelles cartes respectent la limite du jour et le niveau', () => {
  const queue = buildQueue({ notes, states: new Map(), now, level: 'A2', newLimit: 10, newSeenToday: 7 });
  assert.equal(queue.fresh.length, 3);
  // Niveau courant d'abord, puis le niveau inférieur ; jamais un niveau supérieur.
  assert.deepEqual(queue.fresh.map((i) => i.note.id), ['a2-1', 'a1-1', 'a1-2']);
});

test('la carte de production n’arrive qu’après la reconnaissance acquise', () => {
  const states = new Map<string, CardState>([
    ['a1-1::rec', state('a1-1::rec', { phase: 'review', interval: 3, due: now + 86_400_000 })],
    ['a1-2::rec', state('a1-2::rec', { phase: 'learning', due: now + 600_000 })],
  ]);
  const queue = buildQueue({ notes, states, now, level: 'A1', newLimit: 10, newSeenToday: 0 });
  assert.deepEqual(queue.fresh.map((i) => i.cardId), ['a1-1::prod']);
});

test('seules les cartes échues sont proposées, dans l’ordre de la séance', () => {
  const states = new Map<string, CardState>([
    ['a1-1::rec', state('a1-1::rec', { phase: 'review', interval: 3, due: now - 1000 })],
    ['a1-2::rec', state('a1-2::rec', { phase: 'learning', due: now - 5000 })],
    ['a2-1::rec', state('a2-1::rec', { phase: 'review', interval: 3, due: now + 1000 })],
    ['supprimee::rec', state('supprimee::rec', { phase: 'review', due: now - 1000 })],
  ]);
  const queue = buildQueue({ notes, states, now, level: 'A1', newLimit: 0, newSeenToday: 0 });
  assert.deepEqual(sessionOrder(queue).map((i) => i.cardId), ['a1-2::rec', 'a1-1::rec']);
});
