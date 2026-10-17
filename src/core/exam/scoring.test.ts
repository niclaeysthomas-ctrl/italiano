import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choiceScore, countWords, criteriaScore, examOutcome, formatClock } from './scoring.ts';

test('notation des épreuves', () => {
  assert.equal(choiceScore([0, 1, null, 2], [0, 1, 1, 3]), 50);
  assert.equal(criteriaScore([[true, false], [true, true]]), 75);
  assert.equal(criteriaScore([]), 0);
});

test('réussite : 60 % dans chaque épreuve', () => {
  const ok = examOutcome({ listening: 80, reading: 70, structures: 60, writing: 80, speaking: 100 });
  assert.equal(ok.passed, true);
  assert.equal(ok.total, 78);
  const ko = examOutcome({ listening: 90, reading: 90, structures: 50, writing: 90, speaking: 90 });
  assert.equal(ko.passed, false);
  assert.deepEqual(ko.weak, ['structures']);
});

test('mots et chrono', () => {
  assert.equal(countWords("Ciao Marco! Sabato faccio una festa — l'8 alle 20."), 8);
  assert.equal(formatClock(125), '2:05');
  assert.equal(formatClock(-3), '0:00');
});
