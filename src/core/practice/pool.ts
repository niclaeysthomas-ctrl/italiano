/**
 * Réservoir de phrases pour la dictée et l'oral, construit à partir du contenu existant :
 * exemples des cartes (avec traduction) et phrases des lectures.
 */
import { levelPriority } from '../cefr.ts';
import type { Level } from '../cefr.ts';
import { shuffle } from '../random.ts';
import type { Rng } from '../random.ts';
import { splitSentences, wordCount } from '../text/sentences.ts';

export interface PracticeSentence {
  id: string;
  level: Level;
  it: string;
  fr?: string;
}

interface NoteLike {
  id: string;
  level: Level;
  example?: string;
  exampleFr?: string;
}

interface ReadingLike {
  id: string;
  level: Level;
  text: string;
}

export function buildSentencePool(notes: readonly NoteLike[], readings: readonly ReadingLike[], minWords = 3, maxWords = 18): PracticeSentence[] {
  const pool: PracticeSentence[] = [];
  for (const note of notes) {
    if (note.example && inRange(note.example, minWords, maxWords)) {
      pool.push({ id: `ex:${note.id}`, level: note.level, it: note.example, fr: note.exampleFr });
    }
  }
  for (const reading of readings) {
    splitSentences(reading.text).forEach((sentence, index) => {
      if (inRange(sentence, minWords, maxWords)) pool.push({ id: `rd:${reading.id}:${index}`, level: reading.level, it: sentence });
    });
  }
  return pool;
}

function inRange(sentence: string, min: number, max: number): boolean {
  const count = wordCount(sentence);
  return count >= min && count <= max;
}

/** Tire `count` phrases en privilégiant le niveau courant, puis les niveaux inférieurs. */
export function drawSentences(pool: readonly PracticeSentence[], level: Level, count: number, rng: Rng): PracticeSentence[] {
  const eligible = pool.filter((s) => Number.isFinite(levelPriority(s.level, level)));
  const byPriority = new Map<number, PracticeSentence[]>();
  for (const sentence of eligible) {
    const priority = levelPriority(sentence.level, level);
    byPriority.set(priority, [...(byPriority.get(priority) ?? []), sentence]);
  }
  const result: PracticeSentence[] = [];
  for (const priority of [...byPriority.keys()].sort((a, b) => a - b)) {
    for (const sentence of shuffle(byPriority.get(priority)!, rng)) {
      if (result.length >= count) return result;
      result.push(sentence);
    }
  }
  return result;
}
