/**
 * Accès aux données de l'application. Les écrans passent par ici, jamais directement par IndexedDB.
 */
import type { Level } from '../core/cefr.ts';
import { studyDay } from '../core/dates.ts';
import type { LevelScore } from '../core/placement/engine.ts';
import type { CardState, Grade, Phase } from '../core/srs/scheduler.ts';
import type { StudyNote } from '../core/srs/queue.ts';
import { notifyDataChanged } from '../lib/live.ts';
import { STORES, idb, transaction } from './db.ts';

export interface PlacementSummary {
  recommended: Level;
  scores: Partial<Record<Level, LevelScore>>;
  at: number;
}

export interface Profile {
  level: Level;
  createdAt: number;
  placement: PlacementSummary | null;
}

export interface Settings {
  /** Voix italienne choisie (identifiant du navigateur) ; `null` = choix automatique. */
  voiceURI: string | null;
  /** Débit de la synthèse vocale (1 = normal). */
  rate: number;
  /** Nombre maximal de nouvelles cartes par jour. */
  newPerDay: number;
  /** Objectif quotidien en points d'activité. */
  dailyGoal: number;
}

export const DEFAULT_SETTINGS: Settings = { voiceURI: null, rate: 0.95, newPerDay: 10, dailyGoal: 30 };

export interface ReviewEntry {
  id?: number;
  cardId: string;
  grade: Grade;
  phaseBefore: Phase;
  interval: number;
  at: number;
  day: string;
}

export type AttemptKind = 'grammar' | 'reading' | 'dictation' | 'speaking' | 'translation' | 'conjugation';

export interface Attempt {
  id?: number;
  kind: AttemptKind;
  /** Leçon, lecture ou phrase concernée. */
  refId: string;
  /** Score sur 100. */
  score: number;
  at: number;
  day: string;
}

export interface UserNote extends StudyNote {
  source?: string;
  createdAt: number;
}

export interface ExportFile {
  app: 'italiano';
  version: 1;
  exportedAt: string;
  kv: [IDBValidKey, unknown][];
  cards: CardState[];
  reviews: ReviewEntry[];
  attempts: Attempt[];
  userNotes: UserNote[];
}

function markActive(tx: IDBTransaction, day: string) {
  const kv = tx.objectStore('kv');
  const req = kv.get('activeDays');
  req.onsuccess = () => {
    const days: string[] = req.result ?? [];
    if (!days.includes(day)) kv.put([...days, day], 'activeDays');
  };
}

export const repo = {
  async getProfile(): Promise<Profile | null> {
    return (await idb.get<Profile>('kv', 'profile')) ?? null;
  },

  async saveProfile(profile: Profile) {
    await idb.put('kv', profile, 'profile');
    notifyDataChanged();
  },

  async getSettings(): Promise<Settings> {
    return { ...DEFAULT_SETTINGS, ...(await idb.get<Partial<Settings>>('kv', 'settings')) };
  },

  async saveSettings(settings: Settings) {
    await idb.put('kv', settings, 'settings');
    notifyDataChanged();
  },

  async getCardStates(): Promise<Map<string, CardState>> {
    const states = await idb.getAll<CardState>('cards');
    return new Map(states.map((state) => [state.id, state]));
  },

  /** Enregistre la réponse à une carte : nouvel état, entrée de journal et jour d'activité, en une transaction. */
  async recordReview(before: CardState, after: CardState, grade: Grade, now = Date.now()) {
    const day = studyDay(now);
    const entry: ReviewEntry = { cardId: after.id, grade, phaseBefore: before.phase, interval: after.interval, at: now, day };
    await transaction(['cards', 'reviews', 'kv'], 'readwrite', (tx) => {
      tx.objectStore('cards').put(after);
      tx.objectStore('reviews').add(entry);
      markActive(tx, day);
    });
    notifyDataChanged();
  },

  /** Nombre de cartes vues pour la première fois aujourd'hui (pour la limite quotidienne). */
  async countNewSeen(day = studyDay()): Promise<number> {
    const entries = await idb.getByIndex<ReviewEntry>('reviews', 'day', day);
    return new Set(entries.filter((e) => e.phaseBefore === 'new').map((e) => e.cardId)).size;
  },

  async getReviewsSince(day: string): Promise<ReviewEntry[]> {
    return idb.getByIndex<ReviewEntry>('reviews', 'day', IDBKeyRange.lowerBound(day));
  },

  async logAttempt(attempt: Pick<Attempt, 'kind' | 'refId' | 'score'>, now = Date.now()) {
    const day = studyDay(now);
    await transaction(['attempts', 'kv'], 'readwrite', (tx) => {
      tx.objectStore('attempts').add({ ...attempt, score: Math.round(attempt.score), at: now, day });
      markActive(tx, day);
    });
    notifyDataChanged();
  },

  getAttempts: () => idb.getAll<Attempt>('attempts'),

  getAttemptsOn: (day: string) => idb.getByIndex<Attempt>('attempts', 'day', day),

  async getActiveDays(): Promise<string[]> {
    return (await idb.get<string[]>('kv', 'activeDays')) ?? [];
  },

  getUserNotes: () => idb.getAll<UserNote>('userNotes'),

  async addUserNote(note: UserNote) {
    await idb.put('userNotes', note);
    notifyDataChanged();
  },

  async deleteUserNote(id: string) {
    await idb.delete('userNotes', id);
    notifyDataChanged();
  },

  async exportAll(): Promise<ExportFile> {
    const [keys, values, cards, reviews, attempts, userNotes] = await Promise.all([
      idb.getAllKeys('kv'),
      idb.getAll<unknown>('kv'),
      idb.getAll<CardState>('cards'),
      idb.getAll<ReviewEntry>('reviews'),
      idb.getAll<Attempt>('attempts'),
      idb.getAll<UserNote>('userNotes'),
    ]);
    return {
      app: 'italiano',
      version: 1,
      exportedAt: new Date().toISOString(),
      kv: keys.map((key, i) => [key, values[i]]),
      cards,
      reviews,
      attempts,
      userNotes,
    };
  },

  /** Remplace toutes les données locales par celles d'un export. */
  async importAll(file: ExportFile) {
    if (file?.app !== 'italiano' || file.version !== 1) throw new Error('Ce fichier n’est pas un export de cette application.');
    await transaction([...STORES], 'readwrite', (tx) => {
      for (const store of STORES) tx.objectStore(store).clear();
      for (const [key, value] of file.kv) tx.objectStore('kv').put(value, key);
      for (const card of file.cards) tx.objectStore('cards').put(card);
      for (const review of file.reviews) tx.objectStore('reviews').put(review);
      for (const attempt of file.attempts) tx.objectStore('attempts').put(attempt);
      for (const note of file.userNotes) tx.objectStore('userNotes').put(note);
    });
    notifyDataChanged();
  },

  async resetAll() {
    await transaction([...STORES], 'readwrite', (tx) => {
      for (const store of STORES) tx.objectStore(store).clear();
    });
    notifyDataChanged();
  },
};
