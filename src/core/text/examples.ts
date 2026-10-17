/**
 * Retrouve d'autres phrases de l'application qui emploient un mot donné,
 * pour montrer plusieurs exemples par mot sans les écrire à la main.
 */
import { normalizeText, tokenize } from './compare.ts';

const ARTICLES = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', "l'", 'un', 'uno', 'una', "un'"]);

export interface ExampleSentence {
  id: string;
  it: string;
  fr?: string;
}

/**
 * Forme recherchée pour une entrée : le premier segment (avant une virgule, un point-virgule ou une parenthèse),
 * sans article. Renvoie `null` si l'entrée est trop courte pour une recherche fiable.
 */
export function searchKey(entry: string): string[] | null {
  const first = entry.split(/[,;(/…]|\s—\s/)[0];
  const tokens = tokenize(first).filter((t, i) => !(i === 0 && ARTICLES.has(t)));
  if (tokens.length === 0) return null;
  if (tokens.length === 1 && tokens[0].length < 3) return null;
  return tokens;
}

/** Fabrique un test sur un mot : forme exacte pour les mots courts, radical pour les verbes et les mots longs. */
export function wordMatcher(word: string): (token: string) => boolean {
  if (/(are|ere|ire)$/.test(word) && word.length >= 6) {
    const stem = word.slice(0, -3);
    return (t) => t.startsWith(stem) && t.length <= stem.length + 6;
  }
  if (/(arsi|ersi|irsi)$/.test(word) && word.length >= 7) {
    const stem = word.slice(0, -4);
    return (t) => t.startsWith(stem) && t.length <= stem.length + 6;
  }
  if (word.length >= 5) {
    const stem = word.slice(0, -1);
    return (t) => t.startsWith(stem) && t.length <= word.length + 1;
  }
  return (t) => t === word;
}

export function sentenceMatches(key: readonly string[], sentence: string): boolean {
  const tokens = tokenize(sentence);
  if (key.length === 1) {
    const match = wordMatcher(key[0]);
    return tokens.some(match);
  }
  return ` ${normalizeText(sentence)} `.includes(` ${key.join(' ')} `);
}

/** Jusqu'à `limit` phrases qui emploient le mot, en écartant celles déjà connues (`exclude`). */
export function findExamples(entry: string, pool: readonly ExampleSentence[], limit = 3, exclude: readonly string[] = []): ExampleSentence[] {
  const key = searchKey(entry);
  if (!key) return [];
  const skip = new Set(exclude.map((s) => normalizeText(s)));
  const seen = new Set<string>();
  const found: ExampleSentence[] = [];
  for (const sentence of pool) {
    const norm = normalizeText(sentence.it);
    if (skip.has(norm) || seen.has(norm)) continue;
    if (!sentenceMatches(key, sentence.it)) continue;
    seen.add(norm);
    found.push(sentence);
  }
  // Les phrases traduites et courtes d'abord : plus faciles à comprendre.
  found.sort((a, b) => Number(Boolean(b.fr)) - Number(Boolean(a.fr)) || a.it.length - b.it.length);
  return found.slice(0, limit);
}
