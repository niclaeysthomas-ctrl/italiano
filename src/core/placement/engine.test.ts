import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../cefr.ts';
import type { Level } from '../cefr.ts';
import { mulberry32 } from '../random.ts';
import { answerPlacement, buildBlock, currentQuestionId, startPlacement } from './engine.ts';
import type { PlacementItem, PlacementState } from './engine.ts';

const bank: PlacementItem[] = LEVELS.flatMap((level) =>
  Array.from({ length: 5 }, (_, i) => ({ id: `${level}-${i}`, level, skill: i === 0 ? 'listening' : 'grammar' })),
);

/** Joue un test complet ; `knows(level)` dit si la personne répond juste à ce niveau. */
function run(knows: (level: Level, indexInBlock: number) => boolean): PlacementState {
  const rng = mulberry32(42);
  let state = startPlacement(bank, rng);
  let guard = 0;
  while (!state.done && guard++ < 100) {
    const id = currentQuestionId(state)!;
    const level = bank.find((q) => q.id === id)!.level;
    state = answerPlacement(state, bank, knows(level, state.position), rng);
  }
  return state;
}

test('tout juste : on monte jusqu’à C1', () => {
  const state = run(() => true);
  assert.equal(state.recommended, 'C1');
  assert.deepEqual(Object.keys(state.scores), ['A2', 'B1', 'B2', 'C1']);
});

test('tout faux : on redescend à A1', () => {
  const state = run(() => false);
  assert.equal(state.recommended, 'A1');
  assert.deepEqual(Object.keys(state.scores).sort(), ['A1', 'A2']);
});

test('A2 maîtrisé, B1 raté : on travaille B1', () => {
  const state = run((level) => level === 'A1' || level === 'A2');
  assert.equal(state.recommended, 'B1');
});

test('B1 à moitié réussi : on s’arrête en B1', () => {
  const state = run((level, i) => level === 'A2' || (level === 'B1' && i < 2));
  assert.equal(state.recommended, 'B1');
  assert.equal(state.history.length, 8);
});

test('A2 raté puis A1 maîtrisé : on travaille A2', () => {
  const state = run((level) => level === 'A1');
  assert.equal(state.recommended, 'A2');
});

test('chaque bloc contient une question d’écoute et aucune question n’est reposée', () => {
  const block = buildBlock('B2', bank, new Set(), mulberry32(1), 4);
  assert.equal(block.length, 4);
  assert.ok(block.includes('B2-0'));
  const state = run(() => true);
  const ids = state.history.map((h) => h.id);
  assert.equal(new Set(ids).size, ids.length);
});
