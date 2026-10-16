import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidatesFor, pickDaily } from './pick.ts';
import { addDays, computeStreak, lastDays, studyDay } from '../dates.ts';
import { drawSentences } from '../practice/pool.ts';
import { mulberry32 } from '../random.ts';

const readings = [
  { id: 'a1-a', level: 'A1' as const },
  { id: 'a1-b', level: 'A1' as const },
  { id: 'b1-a', level: 'B1' as const },
];

test('le contenu du jour est stable pour une même date', () => {
  const first = pickDaily(readings, '2026-10-16', 'A1');
  assert.equal(pickDaily(readings, '2026-10-16', 'A1'), first);
  assert.ok(first && first.level === 'A1');
});

test('sans contenu au niveau demandé, on prend le niveau inférieur le plus proche', () => {
  assert.deepEqual(candidatesFor(readings, 'A2').map((r) => r.id), ['a1-a', 'a1-b']);
  assert.deepEqual(candidatesFor(readings, 'C1').map((r) => r.id), ['b1-a']);
});

test('série de jours consécutifs', () => {
  const today = '2026-10-16';
  assert.equal(computeStreak(['2026-10-14', '2026-10-15', '2026-10-16'], today), 3);
  assert.equal(computeStreak(['2026-10-14', '2026-10-15'], today), 2);
  assert.equal(computeStreak(['2026-10-13'], today), 0);
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.deepEqual(lastDays(today, 3), ['2026-10-14', '2026-10-15', '2026-10-16']);
  assert.equal(studyDay(new Date(2026, 9, 17, 3, 30).getTime()), '2026-10-16');
});

test('le tirage de phrases privilégie le niveau courant', () => {
  const pool = [
    { id: '1', level: 'A1' as const, it: 'a' },
    { id: '2', level: 'A2' as const, it: 'b' },
    { id: '3', level: 'A2' as const, it: 'c' },
    { id: '4', level: 'B1' as const, it: 'd' },
  ];
  const drawn = drawSentences(pool, 'A2', 3, mulberry32(3));
  assert.deepEqual(drawn.slice(0, 2).map((s) => s.level), ['A2', 'A2']);
  assert.equal(drawn[2].level, 'A1');
});
