/**
 * Conjugaison des verbes italiens : règles régulières (avec les ajustements orthographiques
 * -care/-gare, -ciare/-giare, -iare) et formes irrégulières fournies par verbe.
 */
import type { Level } from '../cefr.ts';

export const TENSES = ['presente', 'passato', 'imperfetto', 'futuro', 'condizionale', 'congiuntivo'] as const;
export type Tense = (typeof TENSES)[number];

export const TENSE_NAMES: Record<Tense, string> = {
  presente: 'Présent',
  passato: 'Passé composé',
  imperfetto: 'Imparfait',
  futuro: 'Futur',
  condizionale: 'Conditionnel',
  congiuntivo: 'Subjonctif présent',
};

/** Niveau à partir duquel chaque temps est travaillé. */
export const TENSE_LEVEL: Record<Tense, Level> = {
  presente: 'A1',
  passato: 'A2',
  imperfetto: 'A2',
  futuro: 'A2',
  condizionale: 'B1',
  congiuntivo: 'B1',
};

export const PERSONS = ['io', 'tu', 'lui, lei', 'noi', 'voi', 'loro'] as const;

type Six = [string, string, string, string, string, string];

export interface Verb {
  inf: string;
  fr: string;
  level: Level;
  aux: 'avere' | 'essere';
  /** Verbes en -ire qui prennent -isc- (capire → capisco). */
  isc?: boolean;
  /** Participe passé irrégulier. */
  pp?: string;
  /** Radical irrégulier du futur et du conditionnel (andare → andr). */
  futStem?: string;
  /** Base irrégulière de l'imparfait (fare → face → facevo). */
  impBase?: string;
  presente?: Six;
  imperfetto?: Six;
  congiuntivo?: Six;
}

const softGroup = (inf: string) => /(c|g)are$/.test(inf);
const dropIGroup = (inf: string) => /(ci|gi)are$/.test(inf);

/** Radical de l'infinitif (parlare → parl). */
function stem(verb: Verb): string {
  return verb.inf.slice(0, -3);
}

/** Ajoute une terminaison en gérant -care/-gare (cerchi) et le i du radical (mangi + i → mangi). */
function join(verb: Verb, ending: string): string {
  let base = stem(verb);
  if (softGroup(verb.inf) && /^[ie]/.test(ending)) base += 'h';
  if (base.endsWith('i') && ending.startsWith('i')) base = base.slice(0, -1);
  return base + ending;
}

function group(verb: Verb): 'are' | 'ere' | 'ire' {
  return verb.inf.slice(-3) as 'are' | 'ere' | 'ire';
}

function presente(verb: Verb): Six {
  if (verb.presente) return verb.presente;
  const g = group(verb);
  if (g === 'are') return ['o', 'i', 'a', 'iamo', 'ate', 'ano'].map((e) => join(verb, e)) as Six;
  if (g === 'ere') return ['o', 'i', 'e', 'iamo', 'ete', 'ono'].map((e) => join(verb, e)) as Six;
  if (verb.isc) return ['isco', 'isci', 'isce', 'iamo', 'ite', 'iscono'].map((e) => join(verb, e)) as Six;
  return ['o', 'i', 'e', 'iamo', 'ite', 'ono'].map((e) => join(verb, e)) as Six;
}

function imperfetto(verb: Verb): Six {
  if (verb.imperfetto) return verb.imperfetto;
  const base = verb.impBase ?? verb.inf.slice(0, -2);
  return ['vo', 'vi', 'va', 'vamo', 'vate', 'vano'].map((e) => base + e) as Six;
}

export function futureStem(verb: Verb): string {
  if (verb.futStem) return verb.futStem;
  if (group(verb) !== 'are') return verb.inf.slice(0, -1);
  let base = stem(verb);
  if (dropIGroup(verb.inf)) base = base.slice(0, -1);
  if (softGroup(verb.inf)) base += 'h';
  return base + 'er';
}

function futuro(verb: Verb): Six {
  const base = futureStem(verb);
  return ['ò', 'ai', 'à', 'emo', 'ete', 'anno'].map((e) => base + e) as Six;
}

function condizionale(verb: Verb): Six {
  const base = futureStem(verb);
  return ['ei', 'esti', 'ebbe', 'emmo', 'este', 'ebbero'].map((e) => base + e) as Six;
}

function congiuntivo(verb: Verb): Six {
  if (verb.congiuntivo) return verb.congiuntivo;
  const g = group(verb);
  const sing = g === 'are' ? 'i' : verb.isc ? 'isca' : 'a';
  const third = g === 'are' ? 'ino' : verb.isc ? 'iscano' : 'ano';
  return [sing, sing, sing, 'iamo', 'iate', third].map((e) => join(verb, e)) as Six;
}

export function participle(verb: Verb): string {
  if (verb.pp) return verb.pp;
  const g = group(verb);
  return stem(verb) + (g === 'are' ? 'ato' : g === 'ere' ? 'uto' : 'ito');
}

const AVERE: Six = ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'];
const ESSERE: Six = ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'];

/** Passé composé, au masculin pour les verbes avec essere (sono andato, siamo andati). */
function passato(verb: Verb): Six {
  const pp = participle(verb);
  if (verb.aux === 'avere') return AVERE.map((a) => `${a} ${pp}`) as Six;
  const plural = pp.slice(0, -1) + 'i';
  return ESSERE.map((a, i) => `${a} ${i < 3 ? pp : plural}`) as Six;
}

export function conjugate(verb: Verb, tense: Tense): Six {
  switch (tense) {
    case 'presente':
      return presente(verb);
    case 'passato':
      return passato(verb);
    case 'imperfetto':
      return imperfetto(verb);
    case 'futuro':
      return futuro(verb);
    case 'condizionale':
      return condizionale(verb);
    case 'congiuntivo':
      return congiuntivo(verb);
  }
}

/**
 * Réponses acceptées pour une forme : la forme elle-même et, au passé composé avec essere,
 * l'accord au féminin (sono andata, siamo andate).
 */
export function acceptedForms(verb: Verb, tense: Tense, person: number): string[] {
  const form = conjugate(verb, tense)[person];
  if (tense !== 'passato' || verb.aux !== 'essere') return [form];
  const feminine = form.replace(/o$/, 'a').replace(/i$/, 'e');
  return [form, feminine];
}
