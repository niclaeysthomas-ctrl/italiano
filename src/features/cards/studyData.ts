import type { Level } from '../../core/cefr.ts';
import { buildQueue } from '../../core/srs/queue.ts';
import type { Queue, StudyNote } from '../../core/srs/queue.ts';
import type { CardState } from '../../core/srs/scheduler.ts';
import { contentNotes } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';

export interface StudySnapshot {
  queue: Queue;
  states: Map<string, CardState>;
  notes: StudyNote[];
}

/** Notes du contenu + mots ajoutés par la personne, et la file du jour qui en découle. */
export async function loadStudySnapshot(level: Level, now = Date.now()): Promise<StudySnapshot> {
  const [states, userNotes, settings, newSeenToday] = await Promise.all([
    repo.getCardStates(),
    repo.getUserNotes(),
    repo.getSettings(),
    repo.countNewSeen(),
  ]);
  // Les mots ajoutés par la personne passent en premier parmi les nouvelles cartes, quel que soit leur niveau.
  const mine: StudyNote[] = userNotes.sort((a, b) => a.createdAt - b.createdAt).map((note) => ({ ...note, level }));
  const notes: StudyNote[] = [...mine, ...contentNotes];
  const queue = buildQueue({ notes, states, now, level, newLimit: settings.newPerDay, newSeenToday });
  return { queue, states, notes };
}
