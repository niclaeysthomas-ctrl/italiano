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

export function validateEveryday(data: unknown, where: string): string[] {
  const r = new Report(where);
  if (!r.check(isObject(data), 'la situation doit être un objet')) return r.errors;
  const topic = data as Json;
  r.check(isText(topic.id), 'id manquant');
  r.check(isText(topic.title), 'title manquant');
  r.check(isLevel(topic.level), 'niveau invalide');
  r.check(isText(topic.intro), 'intro manquante');
  r.check(topic.practice === undefined || typeof topic.practice === 'boolean', 'practice doit être un booléen');
  if (r.check(Array.isArray(topic.dialogue), 'dialogue doit être une liste')) {
    (topic.dialogue as unknown[]).forEach((line, i) => {
      r.check(isObject(line) && isText(line.who) && isText(line.it) && isText(line.fr), `réplique ${i + 1} : who, it et fr requis`);
    });
  }
  if (r.check(Array.isArray(topic.items) && (topic.items as unknown[]).length > 0, 'items doit être une liste non vide')) {
    (topic.items as unknown[]).forEach((item, i) => {
      const label = `expression ${i + 1}`;
      if (!r.check(isObject(item), `${label} doit être un objet`)) return;
      const e = item as Json;
      r.check(isText(e.it) && isText(e.fr), `${label} : it et fr requis`);
      r.check((e.example === undefined) === (e.exampleFr === undefined), `${label} : example et exampleFr vont ensemble`);
    });
  }
  return r.errors;
}

function checkTasks(r: Report, label: string, tasks: unknown, oral: boolean) {
  if (!r.check(Array.isArray(tasks) && (tasks as unknown[]).length > 0, `${label} : au moins une tâche`)) return;
  (tasks as unknown[]).forEach((task, i) => {
    const t = task as Json;
    const where = `${label}, tâche ${i + 1}`;
    if (!r.check(isObject(task), `${where} doit être un objet`)) return;
    r.check(isText(t.prompt) && isText(t.promptFr) && isText(t.model), `${where} : prompt, promptFr et model requis`);
    r.check(Array.isArray(t.criteria) && (t.criteria as unknown[]).length >= 3 && (t.criteria as unknown[]).every(isText), `${where} : au moins trois critères`);
    if (oral) r.check(Number.isInteger(t.prepSeconds), `${where} : prepSeconds requis`);
    else r.check(Number.isInteger(t.minWords) && Number.isInteger(t.maxWords) && (t.minWords as number) < (t.maxWords as number), `${where} : minWords < maxWords requis`);
  });
}

export function validateExam(data: unknown, where: string): string[] {
  const r = new Report(where);
  if (!r.check(isObject(data), "l'examen doit être un objet")) return r.errors;
  const e = data as Json;
  r.check(isText(e.id) && isText(e.title) && isLevel(e.level), 'id, title et level requis');
  const sections = ['listening', 'reading', 'structures', 'writing', 'speaking'];
  for (const name of sections) if (!r.check(isObject(e[name]), `section ${name} manquante`)) return r.errors;
  const listening = e.listening as Json;
  const reading = e.reading as Json;
  const structures = e.structures as Json;
  for (const [name, section] of [['listening', listening], ['reading', reading], ['structures', structures], ['writing', e.writing]] as const) {
    r.check(Number.isInteger((section as Json).minutes) && ((section as Json).minutes as number) > 0, `${name} : durée en minutes requise`);
  }
  if (r.check(Array.isArray(listening.parts) && (listening.parts as unknown[]).length > 0, 'écoute : parties requises')) {
    (listening.parts as Json[]).forEach((part, i) => {
      r.check(isText(part.audio), `écoute ${i + 1} : audio manquant`);
      (part.questions as unknown[] ?? []).forEach((q, j) => checkChoice(r, `écoute ${i + 1}.${j + 1}`, (q as Json).options, (q as Json).answer));
    });
  }
  if (r.check(Array.isArray(reading.texts) && (reading.texts as unknown[]).length > 0, 'lecture : textes requis')) {
    (reading.texts as Json[]).forEach((text, i) => {
      r.check(isText(text.title) && isText(text.text), `lecture ${i + 1} : titre et texte requis`);
      (text.questions as unknown[] ?? []).forEach((q, j) => checkChoice(r, `lecture ${i + 1}.${j + 1}`, (q as Json).options, (q as Json).answer));
    });
  }
  if (r.check(Array.isArray(structures.items) && (structures.items as unknown[]).length >= 8, 'structures : au moins 8 items')) {
    (structures.items as Json[]).forEach((item, i) => {
      r.check(isText(item.text) && (item.text as string).includes('___'), `structure ${i + 1} : le texte doit contenir ___`);
      checkChoice(r, `structure ${i + 1}`, item.options, item.answer);
    });
  }
  checkTasks(r, 'écrit', (e.writing as Json).tasks, false);
  checkTasks(r, 'oral', (e.speaking as Json).tasks, true);
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
