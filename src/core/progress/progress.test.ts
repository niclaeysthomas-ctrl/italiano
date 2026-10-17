import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, parseDay } from '../dates.ts';
import { activityByDay, calendarGrid, levelReadiness } from './progress.ts';

const weekday = (day: string) => (parseDay(day).getDay() + 6) % 7;

test('points par jour', () => {
  const map = activityByDay(['2026-10-16', '2026-10-16', '2026-10-17'], ['2026-10-17']);
  assert.equal(map.get('2026-10-16'), 2);
  assert.equal(map.get('2026-10-17'), 6);
});

test('passage de niveau suggéré seulement quand tout est acquis', () => {
  const base = { level: 'A1' as const, notesTotal: 100, notesLearned: 75, lessonsTotal: 5, lessonsPassed: 4, recentScores: [80, 90, 85, 70, 95] };
  const ok = levelReadiness(base);
  assert.equal(ok.ready, true);
  assert.equal(ok.next, 'A2');
  assert.equal(levelReadiness({ ...base, notesLearned: 50 }).ready, false);
  assert.equal(levelReadiness({ ...base, lessonsPassed: 2 }).ready, false);
  assert.equal(levelReadiness({ ...base, recentScores: [90, 90] }).exercises, null);
  assert.equal(levelReadiness({ ...base, recentScores: [50, 60, 70, 60, 50] }).ready, false);
  assert.equal(levelReadiness({ ...base, level: 'C1' }).ready, false);
});

test('calendrier : semaines complètes, jours futurs vides', () => {
  // 2026-10-17 est un samedi.
  const grid = calendarGrid('2026-10-17', 2, addDays, weekday);
  assert.equal(grid.length, 2);
  assert.deepEqual(grid[0], ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
  assert.deepEqual(grid[1], ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', null]);
});
