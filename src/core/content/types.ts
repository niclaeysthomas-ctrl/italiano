/**
 * Schéma du contenu pédagogique. Tout le contenu vit dans `src/content/` sous forme de fichiers JSON
 * validés par `validate.ts` (voir docs/CONTENU.md pour ajouter des cartes, leçons ou lectures).
 */
import type { Level } from '../cefr.ts';

/** Une note de vocabulaire : elle produit deux cartes (reconnaissance et production). */
export interface Note {
  id: string;
  it: string;
  fr: string;
  example?: string;
  exampleFr?: string;
  /** Niveau propre à la note ; par défaut celui du paquet. */
  level?: Level;
  tags?: string[];
}

export interface Deck {
  id: string;
  title: string;
  level: Level;
  description?: string;
  notes: Note[];
}

export type Skill = 'grammar' | 'vocab' | 'reading' | 'listening';

export interface PlacementQuestion {
  id: string;
  level: Level;
  skill: Skill;
  /** Consigne en français. */
  prompt: string;
  /** Texte italien affiché (avec ___ pour un trou). */
  text?: string;
  /** Texte italien lu par la synthèse vocale, non affiché (questions d'écoute). */
  audio?: string;
  options: string[];
  /** Index de la bonne réponse dans `options`. */
  answer: number;
}

export type LessonBlock =
  | { type: 'p'; text: string }
  | { type: 'rule'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'table'; caption?: string; head: string[]; rows: string[][] }
  | { type: 'examples'; items: { it: string; fr: string }[] };

export type Exercise =
  | { id: string; type: 'choice'; prompt: string; text?: string; options: string[]; answer: number; explanation?: string }
  | { id: string; type: 'cloze'; prompt: string; text: string; answers: string[]; explanation?: string };

export interface GrammarLesson {
  id: string;
  level: Level;
  /** Ordre de la leçon dans son niveau. */
  order: number;
  title: string;
  summary: string;
  blocks: LessonBlock[];
  exercises: Exercise[];
}

export interface ReadingQuestion {
  q: string;
  options: string[];
  answer: number;
}

export interface Reading {
  id: string;
  level: Level;
  title: string;
  /** Paragraphes séparés par une ligne vide. */
  text: string;
  translation?: string;
  glossary: { term: string; fr: string }[];
  questions: ReadingQuestion[];
}
