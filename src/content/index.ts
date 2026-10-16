/**
 * Registre du contenu. Pour ajouter un fichier : le créer dans le bon dossier,
 * puis l'importer ici (voir docs/CONTENU.md). `npm test` vérifie sa structure.
 */
import type { Deck, GrammarLesson, PlacementQuestion, Reading } from '../core/content/types.ts';
import type { StudyNote } from '../core/srs/queue.ts';

import deckA1 from './decks/a1-essentiels.json';
import deckA2 from './decks/a2-quotidien.json';
import deckB1 from './decks/b1-nuances.json';
import deckB2 from './decks/b2-argumenter.json';
import deckC1 from './decks/c1-registre.json';

import placement from './placement/questions.json';

import lessonEssereAvere from './grammar/a1-essere-avere.json';
import lessonArticoli from './grammar/a1-articoli.json';
import lessonPassato from './grammar/a2-passato-prossimo.json';
import lessonCongiuntivo from './grammar/b1-congiuntivo-presente.json';

import readingA1 from './readings/a1-la-mia-giornata.json';
import readingA2 from './readings/a2-weekend-al-lago.json';
import readingB1 from './readings/b1-lavorare-da-casa.json';
import readingB2 from './readings/b2-paradosso-del-turismo.json';
import readingC1 from './readings/c1-arte-di-arrangiarsi.json';

// Les JSON importés sont typés de façon large (string au lieu de 'A1' | 'A2'…) :
// la conformité réelle est garantie par les tests de validation du contenu.
const as = <T>(value: unknown) => value as T;

export const decks: Deck[] = [deckA1, deckA2, deckB1, deckB2, deckC1].map((d) => as<Deck>(d));

export const placementQuestions: PlacementQuestion[] = as<PlacementQuestion[]>(placement);

export const lessons: GrammarLesson[] = [lessonEssereAvere, lessonArticoli, lessonPassato, lessonCongiuntivo]
  .map((l) => as<GrammarLesson>(l))
  .sort((a, b) => a.level.localeCompare(b.level) || a.order - b.order);

export const readings: Reading[] = [readingA1, readingA2, readingB1, readingB2, readingC1].map((r) => as<Reading>(r));

/** Toutes les notes du contenu, avec leur niveau résolu. */
export const contentNotes: StudyNote[] = decks.flatMap((deck) =>
  deck.notes.map((note) => ({
    id: note.id,
    level: note.level ?? deck.level,
    it: note.it,
    fr: note.fr,
    example: note.example,
    exampleFr: note.exampleFr,
  })),
);

export function findLesson(id: string): GrammarLesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

export function findReading(id: string): Reading | undefined {
  return readings.find((reading) => reading.id === id);
}
