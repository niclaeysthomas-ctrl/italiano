import type { Level } from '../../core/cefr.ts';
import { addDays, studyDay } from '../../core/dates.ts';
import { activityByDay, levelReadiness } from '../../core/progress/progress.ts';
import type { LevelReadiness } from '../../core/progress/progress.ts';
import { cardId } from '../../core/srs/queue.ts';
import { contentNotes, lessons } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';

export const CALENDAR_WEEKS = 12;

export interface ProgressSnapshot {
  activity: Map<string, number>;
  todayPoints: number;
  readiness: LevelReadiness;
  learnedByLevel: Map<Level, { learned: number; total: number }>;
}

export async function loadProgress(level: Level, today = studyDay()): Promise<ProgressSnapshot> {
  const since = addDays(today, -7 * CALENDAR_WEEKS);
  const [reviews, attempts, states] = await Promise.all([repo.getReviewsSince(since), repo.getAttempts(), repo.getCardStates()]);

  const activity = activityByDay(
    reviews.map((r) => r.day),
    attempts.filter((a) => a.day >= since).map((a) => a.day),
  );

  const learnedByLevel = new Map<Level, { learned: number; total: number }>();
  for (const note of contentNotes) {
    const entry = learnedByLevel.get(note.level) ?? { learned: 0, total: 0 };
    entry.total += 1;
    if (states.get(cardId(note.id, 'rec'))?.phase === 'review') entry.learned += 1;
    learnedByLevel.set(note.level, entry);
  }

  const levelLessons = lessons.filter((l) => l.level === level);
  const passed = new Set(attempts.filter((a) => a.kind === 'grammar' && a.score >= 70).map((a) => a.refId));
  const recentFrom = addDays(today, -30);
  const words = learnedByLevel.get(level) ?? { learned: 0, total: 0 };

  const readiness = levelReadiness({
    level,
    notesTotal: words.total,
    notesLearned: words.learned,
    lessonsTotal: levelLessons.length,
    lessonsPassed: levelLessons.filter((l) => passed.has(l.id)).length,
    recentScores: attempts.filter((a) => a.day >= recentFrom).map((a) => a.score),
  });

  return { activity, todayPoints: activity.get(today) ?? 0, readiness, learnedByLevel };
}
