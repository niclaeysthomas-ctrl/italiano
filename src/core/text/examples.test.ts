import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findExamples, searchKey, sentenceMatches } from './examples.ts';

const pool = [
  { id: '1', it: 'Mangiamo alle otto.', fr: 'Nous mangeons à huit heures.' },
  { id: '2', it: 'Ho mangiato una pizza.' },
  { id: '3', it: 'La mia casa è piccola.', fr: 'Ma maison est petite.' },
  { id: '4', it: 'Le case sono care.', fr: 'Les maisons sont chères.' },
  { id: '5', it: 'Non riesco a dormire.', fr: 'Je n’arrive pas à dormir.' },
  { id: '6', it: 'Il treno è in ritardo.', fr: 'Le train est en retard.' },
  { id: '7', it: 'I treni sono pieni.' },
];

test('clé de recherche sans article ni précision', () => {
  assert.deepEqual(searchKey('la casa'), ['casa']);
  assert.deepEqual(searchKey("l'amico, l'amica"), ['amico']);
  assert.deepEqual(searchKey('riuscire a'), ['riuscire', 'a']);
  assert.equal(searchKey('a'), null);
});

test('un verbe retrouve ses formes conjuguées', () => {
  assert.deepEqual(findExamples('mangiare', pool).map((s) => s.id), ['1', '2']);
});

test('un nom retrouve son pluriel en -i', () => {
  assert.deepEqual(findExamples('il treno', pool).map((s) => s.id).sort(), ['6', '7']);
});

test('un mot court ne retrouve que la forme exacte', () => {
  assert.deepEqual(findExamples('la casa', pool).map((s) => s.id), ['3']);
});

test('une expression se cherche telle quelle et l’exemple déjà connu est exclu', () => {
  assert.ok(sentenceMatches(['riesco', 'a'], 'Non riesco a dormire.'));
  assert.deepEqual(findExamples('il treno', pool, 3, ['Il treno è in ritardo.']).map((s) => s.id), ['7']);
});
