/**
 * Registre du contenu. Pour ajouter un fichier : le créer dans le bon dossier,
 * puis l'importer ici (voir docs/CONTENU.md). `npm test` vérifie sa structure.
 */
import type { Deck, GrammarLesson, PlacementQuestion, Reading } from '../core/content/types.ts';
import type { StudyNote } from '../core/srs/queue.ts';

import deck_a1_cibo from './decks/a1-cibo.json';
import deck_a1_citta from './decks/a1-citta.json';
import deck_a1_descrire from './decks/a1-descrire.json';
import deck_a1_essentiels from './decks/a1-essentiels.json';
import deck_a1_nombres_temps from './decks/a1-nombres-temps.json';
import deck_a1_personnes from './decks/a1-personnes.json';
import deck_a1_phrases from './decks/a1-phrases.json';
import deck_a1_verbes from './decks/a1-verbes.json';
import deck_a2_acquisti from './decks/a2-acquisti.json';
import deck_a2_casa from './decks/a2-casa.json';
import deck_a2_lavoro_salute from './decks/a2-lavoro-salute.json';
import deck_a2_phrases from './decks/a2-phrases.json';
import deck_a2_quotidien from './decks/a2-quotidien.json';
import deck_a2_verbes_expressions from './decks/a2-verbes-expressions.json';
import deck_a2_viaggi from './decks/a2-viaggi.json';
import deck_b1_emozioni from './decks/b1-emozioni.json';
import deck_b1_lavoro from './decks/b1-lavoro.json';
import deck_b1_nuances from './decks/b1-nuances.json';
import deck_b1_phrases from './decks/b1-phrases.json';
import deck_b1_societe from './decks/b1-societe.json';
import deck_b1_verbes from './decks/b1-verbes.json';
import deck_b2_argumenter from './decks/b2-argumenter.json';
import deck_b2_connecteurs from './decks/b2-connecteurs.json';
import deck_b2_idiomes from './decks/b2-idiomes.json';
import deck_b2_phrases from './decks/b2-phrases.json';
import deck_b2_societe_economie from './decks/b2-societe-economie.json';
import deck_b2_verbes from './decks/b2-verbes.json';
import deck_c1_idiomes from './decks/c1-idiomes.json';
import deck_c1_langue_soutenue from './decks/c1-langue-soutenue.json';
import deck_c1_nuances from './decks/c1-nuances.json';
import deck_c1_phrases from './decks/c1-phrases.json';
import deck_c1_registre from './decks/c1-registre.json';

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

export const decks: Deck[] = [
  // Ordre d'apparition des nouvelles cartes au sein d'un niveau.
  deck_a1_essentiels,
  deck_a1_phrases,
  deck_a1_nombres_temps,
  deck_a1_personnes,
  deck_a1_verbes,
  deck_a1_cibo,
  deck_a1_citta,
  deck_a1_descrire,
  deck_a2_quotidien,
  deck_a2_verbes_expressions,
  deck_a2_phrases,
  deck_a2_casa,
  deck_a2_acquisti,
  deck_a2_viaggi,
  deck_a2_lavoro_salute,
  deck_b1_nuances,
  deck_b1_phrases,
  deck_b1_verbes,
  deck_b1_emozioni,
  deck_b1_societe,
  deck_b1_lavoro,
  deck_b2_argumenter,
  deck_b2_connecteurs,
  deck_b2_phrases,
  deck_b2_verbes,
  deck_b2_idiomes,
  deck_b2_societe_economie,
  deck_c1_registre,
  deck_c1_phrases,
  deck_c1_langue_soutenue,
  deck_c1_nuances,
  deck_c1_idiomes,
].map((d) => as<Deck>(d));

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
