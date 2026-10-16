/**
 * Validation du contenu JSON. Utilisée par les tests (`npm test`) pour refuser un fichier mal formé
 * avant qu'il n'arrive dans l'application.
 */
import { LEVELS, isLevel } from '../cefr.ts';

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const SKILLS = ['grammar', 'vocab', 'reading', 'listening'];

class Report {
  errors: string[] = [];
  readonly where: string;
  constructor(where: string) {
    this.where = where;
  }
  check(condition: unknown, message: string): boolean {
    if (!condition) this.errors.push(`${this.where} : ${message}`);
    return Boolean(condition);
  }
}

function checkChoice(r: Report, label: string, options: unknown, answer: unknown) {
  if (r.check(Array.isArray(options) && options.length >= 2 && options.every(isText), `${label} doit avoir au moins deux options`)) {
    const list = options as string[];
    r.check(Number.isInteger(answer) && (answer as number) >= 0 && (answer as number) < list.length, `${label} : index de réponse hors limites`);
    r.check(new Set(list).size === list.length, `${label} : options en double`);
  }
}

export function validateDeck(data: unknown, where: string): string[] {
  const r = new Report(where);
  if (!r.check(isObject(data), 'le paquet doit être un objet')) return r.errors;
  const deck = data as Json;
  r.check(isText(deck.id), 'id manquant');
  r.check(isText(deck.title), 'title manquant');
  r.check(isLevel(deck.level), `level doit valoir ${LEVELS.join(', ')}`);
  if (!r.check(Array.isArray(deck.notes), 'notes doit être une liste')) return r.errors;
  (deck.notes as unknown[]).forEach((note, i) => {
    const label = `note ${i + 1}`;
    if (!r.check(isObject(note), `${label} doit être un objet`)) return;
    const n = note as Json;
    r.check(isText(n.id), `${label} : id manquant`);
    r.check(isText(n.it), `${label} : champ it manquant`);
    r.check(isText(n.fr), `${label} : champ fr manquant`);
    r.check(n.level === undefined || isLevel(n.level), `${label} : niveau invalide`);
    r.check((n.example === undefined) === (n.exampleFr === undefined), `${label} : example et exampleFr vont ensemble`);
  });
  return r.errors;
}

export function validatePlacement(data: unknown, where: string): string[] {
  const r = new Report(where);
  if (!r.check(Array.isArray(data), 'la banque de questions doit être une liste')) return r.errors;
  (data as unknown[]).forEach((item, i) => {
    const label = `question ${i + 1}`;
    if (!r.check(isObject(item), `${label} doit être un objet`)) return;
    const q = item as Json;
    r.check(isText(q.id), `${label} : id manquant`);
    r.check(isLevel(q.level), `${label} : niveau invalide`);
    r.check(SKILLS.includes(q.skill as string), `${label} : compétence invalide`);
    r.check(isText(q.prompt), `${label} : consigne manquante`);
    r.check(q.skill !== 'listening' || isText(q.audio), `${label} : une question d'écoute a besoin d'un champ audio`);
    r.check(q.skill === 'listening' || isText(q.text) || isText(q.prompt), `${label} : texte manquant`);
    checkChoice(r, label, q.options, q.answer);
  });
  return r.errors;
}

export function validateLesson(data: unknown, where: string): string[] {
  const r = new Report(where);
  if (!r.check(isObject(data), 'la leçon doit être un objet')) return r.errors;
  const lesson = data as Json;
  r.check(isText(lesson.id), 'id manquant');
  r.check(isLevel(lesson.level), 'niveau invalide');
  r.check(Number.isInteger(lesson.order), 'order doit être un entier');
  r.check(isText(lesson.title), 'title manquant');
  r.check(isText(lesson.summary), 'summary manquant');
  if (r.check(Array.isArray(lesson.blocks), 'blocks doit être une liste')) {
    (lesson.blocks as unknown[]).forEach((block, i) => {
      const label = `bloc ${i + 1}`;
      if (!r.check(isObject(block), `${label} doit être un objet`)) return;
      const b = block as Json;
      switch (b.type) {
        case 'p':
        case 'rule':
        case 'tip':
          r.check(isText(b.text), `${label} : texte manquant`);
          break;
        case 'table': {
          const head = b.head as unknown[];
          const rows = b.rows as unknown[];
          if (r.check(Array.isArray(head) && Array.isArray(rows), `${label} : head et rows requis`)) {
            r.check(rows.every((row) => Array.isArray(row) && row.length === head.length), `${label} : chaque ligne doit avoir ${head.length} cellules`);
          }
          break;
        }
        case 'examples':
          r.check(Array.isArray(b.items) && (b.items as unknown[]).every((x) => isObject(x) && isText(x.it) && isText(x.fr)), `${label} : exemples invalides`);
          break;
        default:
          r.check(false, `${label} : type inconnu « ${String(b.type)} »`);
      }
    });
  }
  if (r.check(Array.isArray(lesson.exercises), 'exercises doit être une liste')) {
    (lesson.exercises as unknown[]).forEach((exercise, i) => {
      const label = `exercice ${i + 1}`;
      if (!r.check(isObject(exercise), `${label} doit être un objet`)) return;
      const e = exercise as Json;
      r.check(isText(e.id), `${label} : id manquant`);
      r.check(isText(e.prompt), `${label} : consigne manquante`);
      if (e.type === 'choice') checkChoice(r, label, e.options, e.answer);
      else if (e.type === 'cloze') {
        r.check(isText(e.text) && (e.text as string).includes('___'), `${label} : le texte doit contenir ___`);
        r.check(Array.isArray(e.answers) && (e.answers as unknown[]).length > 0 && (e.answers as unknown[]).every(isText), `${label} : réponses acceptées manquantes`);
      } else r.check(false, `${label} : type inconnu « ${String(e.type)} »`);
    });
  }
  return r.errors;
}

export function validateReading(data: unknown, where: string): string[] {
  const r = new Report(where);
  if (!r.check(isObject(data), 'la lecture doit être un objet')) return r.errors;
  const reading = data as Json;
  r.check(isText(reading.id), 'id manquant');
  r.check(isLevel(reading.level), 'niveau invalide');
  r.check(isText(reading.title), 'title manquant');
  if (!r.check(isText(reading.text), 'text manquant')) return r.errors;
  const text = (reading.text as string).toLowerCase();
  if (r.check(Array.isArray(reading.glossary), 'glossary doit être une liste')) {
    (reading.glossary as unknown[]).forEach((entry, i) => {
      const ok = isObject(entry) && isText(entry.term) && isText(entry.fr);
      if (r.check(ok, `glossaire ${i + 1} : term et fr requis`)) {
        const term = ((entry as Json).term as string).toLowerCase();
        r.check(text.includes(term), `glossaire : « ${term} » n'apparaît pas dans le texte`);
      }
    });
  }
  if (r.check(Array.isArray(reading.questions), 'questions doit être une liste')) {
    (reading.questions as unknown[]).forEach((question, i) => {
      const label = `question ${i + 1}`;
      if (!r.check(isObject(question) && isText(question.q), `${label} : intitulé manquant`)) return;
      checkChoice(r, label, (question as Json).options, (question as Json).answer);
    });
  }
  return r.errors;
}

/** Vérifie qu'aucun identifiant n'est utilisé deux fois dans une collection. */
export function findDuplicateIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}
