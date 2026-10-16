import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MINUTE } from '../dates.ts';
import { formatDays, newCardState, previewDelays, reviewDue, schedule } from './scheduler.ts';
import type { CardState } from './scheduler.ts';

const now = new Date(2026, 0, 10, 12, 0).getTime();

function reviewCard(interval: number, ease = 2.5, due = now): CardState {
  return { ...newCardState('n1::rec', now), phase: 'review', interval, ease, due };
}

test('une nouvelle carte suit les étapes d’apprentissage', () => {
  const card = newCardState('n1::rec', now);
  assert.equal(schedule(card, 'again', now).due, now + 1 * MINUTE);
  assert.equal(schedule(card, 'hard', now).due, now + 5.5 * MINUTE);
  const good = schedule(card, 'good', now);
  assert.equal(good.phase, 'learning');
  assert.equal(good.step, 1);
  assert.equal(good.due, now + 10 * MINUTE);
});

test('« Facile » sur une nouvelle carte la fait passer en révision à 4 jours', () => {
  const easy = schedule(newCardState('n1::rec', now), 'easy', now);
  assert.equal(easy.phase, 'review');
  assert.equal(easy.interval, 4);
});

test('la dernière étape réussie donne une révision le lendemain à 4 h', () => {
  const step1 = schedule(newCardState('n1::rec', now), 'good', now);
  const graduated = schedule(step1, 'good', now + 10 * MINUTE);
  assert.equal(graduated.phase, 'review');
  assert.equal(graduated.interval, 1);
  assert.equal(graduated.due, new Date(2026, 0, 11, 4, 0).getTime());
});

test('révision à l’heure : difficile, bien, facile', () => {
  const card = reviewCard(10);
  const hard = schedule(card, 'hard', now);
  assert.equal(hard.interval, 12);
  assert.equal(hard.ease, 2.35);
  assert.equal(schedule(card, 'good', now).interval, 25);
  const easy = schedule(card, 'easy', now);
  assert.equal(easy.interval, 33);
  assert.equal(easy.ease, 2.65);
});

test('un retard de révision est partiellement pris en compte', () => {
  const late = reviewCard(10, 2.5, now - 4 * 24 * 60 * MINUTE);
  assert.equal(schedule(late, 'good', now).interval, 30);
});

test('un oubli envoie la carte en réapprentissage et réduit la facilité', () => {
  const lapsed = schedule(reviewCard(20), 'again', now);
  assert.equal(lapsed.phase, 'relearning');
  assert.equal(lapsed.lapses, 1);
  assert.equal(lapsed.ease, 2.3);
  assert.equal(lapsed.interval, 1);
  assert.equal(lapsed.due, now + 10 * MINUTE);
  const back = schedule(lapsed, 'good', now + 10 * MINUTE);
  assert.equal(back.phase, 'review');
  assert.equal(back.interval, 1);
});

test('la facilité ne descend pas sous le plancher', () => {
  let card = reviewCard(5, 1.35);
  card = schedule(card, 'hard', now);
  assert.equal(card.ease, 1.3);
});

test('l’échéance respecte la bascule de 4 h du matin', () => {
  assert.equal(reviewDue(new Date(2026, 0, 10, 21, 0).getTime(), 1), new Date(2026, 0, 11, 4, 0).getTime());
  // À 2 h du matin, on est encore dans la journée d’étude de la veille.
  assert.equal(reviewDue(new Date(2026, 0, 11, 2, 0).getTime(), 1), new Date(2026, 0, 11, 4, 0).getTime());
});

test('les libellés de délai sont lisibles', () => {
  assert.deepEqual(previewDelays(newCardState('x::rec', now), now), { again: '1 min', hard: '6 min', good: '10 min', easy: '4 j' });
  assert.equal(formatDays(45), '2 mois');
  assert.equal(formatDays(400), '1,1 an');
  assert.equal(formatDays(800), '2,2 ans');
});
