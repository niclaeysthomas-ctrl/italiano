/**
 * Registre du contenu. Pour ajouter un fichier : le créer dans le bon dossier,
 * puis l'importer ici (voir docs/CONTENU.md). `npm test` vérifie sa structure.
 */
import type { Deck, EverydayTopic, GrammarLesson, PlacementQuestion, Reading } from '../core/content/types.ts';
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

import deck_a1_mots_frequents from './decks/a1-mots-frequents.json';
import deck_a2_phrases_quotidien from './decks/a2-phrases-quotidien.json';
import deck_b1_phrases_traduction from './decks/b1-phrases-traduction.json';
import deck_b2_cultura from './decks/b2-cultura.json';
import deck_c1_argumentation from './decks/c1-argumentation.json';

import placement from './placement/questions.json';

import lesson_a1_articoli from './grammar/a1-articoli.json';
import lesson_a1_essere_avere from './grammar/a1-essere-avere.json';
import lesson_a1_possessivi from './grammar/a1-possessivi.json';
import lesson_a1_preposizioni from './grammar/a1-preposizioni.json';
import lesson_a1_presente from './grammar/a1-presente.json';
import lesson_a2_futuro from './grammar/a2-futuro.json';
import lesson_a2_imperfetto from './grammar/a2-imperfetto.json';
import lesson_a2_passato_prossimo from './grammar/a2-passato-prossimo.json';
import lesson_a2_pronomi_diretti from './grammar/a2-pronomi-diretti.json';
import lesson_a2_riflessivi from './grammar/a2-riflessivi.json';
import lesson_b1_condizionale from './grammar/b1-condizionale.json';
import lesson_b1_congiuntivo_presente from './grammar/b1-congiuntivo-presente.json';
import lesson_b1_periodo_ipotetico from './grammar/b1-periodo-ipotetico.json';
import lesson_b1_pronomi_combinati from './grammar/b1-pronomi-combinati.json';
import lesson_b1_relativi from './grammar/b1-relativi.json';
import lesson_b2_concordanza from './grammar/b2-concordanza.json';
import lesson_b2_gerundio from './grammar/b2-gerundio.json';
import lesson_b2_passivo_si from './grammar/b2-passivo-si.json';
import lesson_c1_discorso_indiretto from './grammar/c1-discorso-indiretto.json';
import lesson_c1_ipotetico_misto from './grammar/c1-ipotetico-misto.json';
import lesson_c1_passato_remoto from './grammar/c1-passato-remoto.json';

import reading_a1_al_mercato from './readings/a1-al-mercato.json';
import reading_a1_in_albergo from './readings/a1-in-albergo.json';
import reading_a1_la_mia_famiglia from './readings/a1-la-mia-famiglia.json';
import reading_a1_la_mia_giornata from './readings/a1-la-mia-giornata.json';
import reading_a2_cena_tra_amici from './readings/a2-cena-tra-amici.json';
import reading_a2_nuovo_lavoro from './readings/a2-nuovo-lavoro.json';
import reading_a2_ricetta_carbonara from './readings/a2-ricetta-carbonara.json';
import reading_a2_weekend_al_lago from './readings/a2-weekend-al-lago.json';
import reading_b1_lavorare_da_casa from './readings/b1-lavorare-da-casa.json';
import reading_b1_rito_del_caffe from './readings/b1-rito-del-caffe.json';
import reading_b1_slow_food from './readings/b1-slow-food.json';
import reading_b1_vespa from './readings/b1-vespa.json';
import reading_b2_borghi_abbandonati from './readings/b2-borghi-abbandonati.json';
import reading_b2_fuga_dei_cervelli from './readings/b2-fuga-dei-cervelli.json';
import reading_b2_gesti from './readings/b2-gesti.json';
import reading_b2_paradosso_del_turismo from './readings/b2-paradosso-del-turismo.json';
import reading_c1_arte_di_arrangiarsi from './readings/c1-arte-di-arrangiarsi.json';
import reading_c1_calvino from './readings/c1-calvino.json';
import reading_c1_lingua_e_dialetti from './readings/c1-lingua-e-dialetti.json';
import reading_c1_made_in_italy from './readings/c1-made-in-italy.json';

import everyday_01_bar from './everyday/01-bar.json';
import everyday_02_saluti from './everyday/02-saluti.json';
import everyday_03_telefono from './everyday/03-telefono.json';
import everyday_04_reagire from './everyday/04-reagire.json';
import everyday_05_riempitivi from './everyday/05-riempitivi.json';
import everyday_06_messaggi from './everyday/06-messaggi.json';
import everyday_07_ristorante from './everyday/07-ristorante.json';
import everyday_08_trasporti from './everyday/08-trasporti.json';
import everyday_09_invito from './everyday/09-invito.json';
import everyday_10_negozi from './everyday/10-negozi.json';
import everyday_11_salute from './everyday/11-salute.json';
import everyday_12_umore from './everyday/12-umore.json';
import everyday_13_appuntamenti from './everyday/13-appuntamenti.json';
import everyday_14_ufficio from './everyday/14-ufficio.json';
import everyday_15_reclami from './everyday/15-reclami.json';
import everyday_16_chiacchiere from './everyday/16-chiacchiere.json';

// Les JSON importés sont typés de façon large (string au lieu de 'A1' | 'A2'…) :
// la conformité réelle est garantie par les tests de validation du contenu.
const as = <T>(value: unknown) => value as T;

export const decks: Deck[] = [
  // Ordre d'apparition des nouvelles cartes au sein d'un niveau.
  deck_a1_essentiels,
  deck_a1_phrases,
  deck_a1_mots_frequents,
  deck_a1_nombres_temps,
  deck_a1_personnes,
  deck_a1_verbes,
  deck_a1_cibo,
  deck_a1_citta,
  deck_a1_descrire,
  deck_a2_quotidien,
  deck_a2_verbes_expressions,
  deck_a2_phrases,
  deck_a2_phrases_quotidien,
  deck_a2_casa,
  deck_a2_acquisti,
  deck_a2_viaggi,
  deck_a2_lavoro_salute,
  deck_b1_nuances,
  deck_b1_phrases,
  deck_b1_phrases_traduction,
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
  deck_b2_cultura,
  deck_c1_registre,
  deck_c1_phrases,
  deck_c1_langue_soutenue,
  deck_c1_nuances,
  deck_c1_idiomes,
  deck_c1_argumentation,
].map((d) => as<Deck>(d));

export const placementQuestions: PlacementQuestion[] = as<PlacementQuestion[]>(placement);

export const lessons: GrammarLesson[] = [
  lesson_a1_articoli,
  lesson_a1_essere_avere,
  lesson_a1_possessivi,
  lesson_a1_preposizioni,
  lesson_a1_presente,
  lesson_a2_futuro,
  lesson_a2_imperfetto,
  lesson_a2_passato_prossimo,
  lesson_a2_pronomi_diretti,
  lesson_a2_riflessivi,
  lesson_b1_condizionale,
  lesson_b1_congiuntivo_presente,
  lesson_b1_periodo_ipotetico,
  lesson_b1_pronomi_combinati,
  lesson_b1_relativi,
  lesson_b2_concordanza,
  lesson_b2_gerundio,
  lesson_b2_passivo_si,
  lesson_c1_discorso_indiretto,
  lesson_c1_ipotetico_misto,
  lesson_c1_passato_remoto,
]
  .map((l) => as<GrammarLesson>(l))
  .sort((a, b) => a.level.localeCompare(b.level) || a.order - b.order);

export const readings: Reading[] = [
  reading_a1_al_mercato,
  reading_a1_in_albergo,
  reading_a1_la_mia_famiglia,
  reading_a1_la_mia_giornata,
  reading_a2_cena_tra_amici,
  reading_a2_nuovo_lavoro,
  reading_a2_ricetta_carbonara,
  reading_a2_weekend_al_lago,
  reading_b1_lavorare_da_casa,
  reading_b1_rito_del_caffe,
  reading_b1_slow_food,
  reading_b1_vespa,
  reading_b2_borghi_abbandonati,
  reading_b2_fuga_dei_cervelli,
  reading_b2_gesti,
  reading_b2_paradosso_del_turismo,
  reading_c1_arte_di_arrangiarsi,
  reading_c1_calvino,
  reading_c1_lingua_e_dialetti,
  reading_c1_made_in_italy,
].map((r) => as<Reading>(r));

export const everydayTopics: EverydayTopic[] = [
  everyday_01_bar,
  everyday_02_saluti,
  everyday_03_telefono,
  everyday_04_reagire,
  everyday_05_riempitivi,
  everyday_06_messaggi,
  everyday_07_ristorante,
  everyday_08_trasporti,
  everyday_09_invito,
  everyday_10_negozi,
  everyday_11_salute,
  everyday_12_umore,
  everyday_13_appuntamenti,
  everyday_14_ufficio,
  everyday_15_reclami,
  everyday_16_chiacchiere,
].map((t) => as<EverydayTopic>(t));

export function findEverydayTopic(id: string): EverydayTopic | undefined {
  return everydayTopics.find((topic) => topic.id === id);
}

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
