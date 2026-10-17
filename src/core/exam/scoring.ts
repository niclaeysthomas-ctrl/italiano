/**
 * Notation d'un examen blanc. Les trois premières épreuves sont corrigées automatiquement ;
 * l'expression écrite et orale sont auto-évaluées avec des critères.
 * Le seuil de réussite (60 % par épreuve) est celui de l'application : les barèmes officiels
 * varient selon la certification et le niveau.
 */
export const SECTIONS = ['listening', 'reading', 'structures', 'writing', 'speaking'] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_NAMES: Record<Section, string> = {
  listening: 'Compréhension orale',
  reading: 'Compréhension écrite',
  structures: 'Grammaire et vocabulaire',
  writing: 'Expression écrite',
  speaking: 'Expression orale',
};

export const SECTION_IT: Record<Section, string> = {
  listening: 'Ascolto',
  reading: 'Comprensione della lettura',
  structures: 'Analisi delle strutture di comunicazione',
  writing: 'Produzione scritta',
  speaking: 'Produzione orale',
};

export const PASS_MARK = 60;

/** Pourcentage de bonnes réponses (réponses absentes = fausses). */
export function choiceScore(answers: readonly (number | null)[], keys: readonly number[]): number {
  if (keys.length === 0) return 0;
  const correct = keys.filter((key, i) => answers[i] === key).length;
  return Math.round((100 * correct) / keys.length);
}

/** Pourcentage de critères cochés, toutes tâches confondues. */
export function criteriaScore(checked: readonly boolean[][]): number {
  const all = checked.flat();
  if (all.length === 0) return 0;
  return Math.round((100 * all.filter(Boolean).length) / all.length);
}

export interface ExamOutcome {
  scores: Record<Section, number>;
  total: number;
  passed: boolean;
  /** Épreuves sous le seuil. */
  weak: Section[];
}

export function examOutcome(scores: Record<Section, number>): ExamOutcome {
  const values = SECTIONS.map((s) => scores[s]);
  const total = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const weak = SECTIONS.filter((s) => scores[s] < PASS_MARK);
  return { scores, total, passed: weak.length === 0, weak };
}

export function countWords(text: string): number {
  return text.split(/\s+/u).filter((w) => /\p{L}/u.test(w)).length;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
