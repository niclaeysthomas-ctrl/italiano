/**
 * Valide tous les fichiers JSON de `src/content/`. Un fichier mal formé fait échouer `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LEVELS } from '../cefr.ts';
import { DEFAULT_PLACEMENT } from '../placement/engine.ts';
import { findDuplicateIds, validateDeck, validateEveryday, validateLesson, validatePlacement, validateReading } from './validate.ts';

const root = join(import.meta.dirname, '..', '..', 'content');

function load(folder: string): { file: string; data: unknown }[] {
  return readdirSync(join(root, folder))
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({ file: `${folder}/${file}`, data: JSON.parse(readFileSync(join(root, folder, file), 'utf8')) }));
}

function expectValid(errors: string[]) {
  assert.deepEqual(errors, [], errors.join('\n'));
}

test('paquets de cartes', () => {
  const decks = load('decks');
  assert.ok(decks.length > 0);
  for (const { file, data } of decks) expectValid(validateDeck(data, file));
  const ids = decks.flatMap(({ data }) => (data as { notes: { id: string }[] }).notes.map((n) => n.id));
  assert.deepEqual(findDuplicateIds(ids), []);
});

test('banque du test de niveau', () => {
  for (const { file, data } of load('placement')) {
    expectValid(validatePlacement(data, file));
    const questions = data as { id: string; level: string; skill: string }[];
    assert.deepEqual(findDuplicateIds(questions.map((q) => q.id)), []);
    for (const level of LEVELS) {
      const count = questions.filter((q) => q.level === level).length;
      assert.ok(count >= DEFAULT_PLACEMENT.perLevel, `${level} : ${count} questions, il en faut au moins ${DEFAULT_PLACEMENT.perLevel}`);
    }
  }
});

test('leçons de grammaire', () => {
  const lessons = load('grammar');
  for (const { file, data } of lessons) expectValid(validateLesson(data, file));
  assert.deepEqual(findDuplicateIds(lessons.map(({ data }) => (data as { id: string }).id)), []);
});

test('lectures', () => {
  const readings = load('readings');
  for (const { file, data } of readings) expectValid(validateReading(data, file));
  assert.deepEqual(findDuplicateIds(readings.map(({ data }) => (data as { id: string }).id)), []);
});

test('italien du quotidien', () => {
  const topics = load('everyday');
  assert.ok(topics.length > 0);
  for (const { file, data } of topics) expectValid(validateEveryday(data, file));
  assert.deepEqual(findDuplicateIds(topics.map(({ data }) => (data as { id: string }).id)), []);
});
