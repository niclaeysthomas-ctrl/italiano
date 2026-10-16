import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, diffWords, normalizeText, scoreDiff, tokenize } from './compare.ts';
import { splitSentences } from './sentences.ts';

test('la normalisation ignore la casse et la ponctuation', () => {
  assert.equal(normalizeText('Ciao, Marco!'), 'ciao marco');
  assert.deepEqual(tokenize('Dov’è l’amico?'), ["dov'", 'è', "l'", 'amico']);
});

test('une phrase identique obtient 100', () => {
  const ops = diffWords('Vorrei un caffè, per favore.', 'vorrei un caffè per favore');
  assert.ok(ops.every((op) => op.kind === 'ok'));
  assert.equal(scoreDiff(ops), 100);
});

test('un accent oublié est signalé et compte pour moitié', () => {
  const ops = diffWords('Perché sei qui', 'perche sei qui');
  assert.equal(ops[0].kind, 'accent');
  assert.equal(scoreDiff(ops), 83);
});

test('mots manquants, en trop et remplacés', () => {
  const ops = diffWords('io vado al mare', 'io vado mare oggi');
  assert.deepEqual(ops.map((op) => op.kind), ['ok', 'ok', 'missing', 'ok', 'extra']);
  assert.equal(scoreDiff(ops), 60);
  assert.equal(diffWords('il gatto nero', 'il cane nero')[1].kind, 'sub');
});

test('une réponse vide obtient 0', () => {
  assert.equal(scoreDiff(diffWords('ciao a tutti', '')), 0);
});

test('vérification des réponses courtes', () => {
  assert.equal(checkAnswer(' Ho ', ['ho']), 'correct');
  assert.equal(checkAnswer('l’', ["l'"]), 'correct');
  assert.equal(checkAnswer('e', ['è']), 'accent');
  assert.equal(checkAnswer('sono', ['ho']), 'wrong');
});

test('découpage en phrases', () => {
  assert.deepEqual(splitSentences('Ciao! Come stai? Bene.'), ['Ciao!', 'Come stai?', 'Bene.']);
});
