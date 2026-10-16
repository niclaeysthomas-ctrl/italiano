/**
 * Comparaison de phrases mot à mot, utilisée par la dictée et l'entraînement oral.
 * Une erreur portant uniquement sur un accent (perche / perché) est signalée à part
 * et compte pour moitié.
 */

export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Minuscules, apostrophes uniformisées, ponctuation retirée. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/'/g, "' ")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Découpe en mots ; une élision reste attachée au mot qui la précède (« l'amico » → « l' », « amico »). */
export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(' ') : [];
}

export type DiffOp =
  | { kind: 'ok'; expected: string; actual: string }
  | { kind: 'accent'; expected: string; actual: string }
  | { kind: 'sub'; expected: string; actual: string }
  | { kind: 'missing'; expected: string }
  | { kind: 'extra'; actual: string };

function compareTokens(expected: string, actual: string): 'ok' | 'accent' | 'sub' {
  if (expected === actual) return 'ok';
  return stripAccents(expected) === stripAccents(actual) ? 'accent' : 'sub';
}

/** Alignement par distance d'édition sur les mots, puis retour arrière pour lister les opérations. */
export function diffWords(expectedText: string, actualText: string): DiffOp[] {
  const a = tokenize(expectedText);
  const b = tokenize(actualText);
  const cost = (i: number, j: number) => {
    const match = compareTokens(a[i], b[j]);
    return match === 'ok' ? 0 : match === 'accent' ? 0.5 : 1;
  };
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost(i - 1, j - 1));
    }
  }

  const ops: DiffOp[] = [];
  let i = a.length;
  let j = b.length;
  // À coût égal, on préfère « mot manquant / mot en trop » à une substitution : c'est plus parlant.
  while (i > 0 || j > 0) {
    const diagonal = i > 0 && j > 0 ? compareTokens(a[i - 1], b[j - 1]) : null;
    const diagonalFits = diagonal !== null && d[i][j] === d[i - 1][j - 1] + cost(i - 1, j - 1);
    if (diagonalFits && diagonal !== 'sub') {
      ops.push({ kind: diagonal, expected: a[i - 1], actual: b[j - 1] });
      i--;
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      ops.push({ kind: 'missing', expected: a[i - 1] });
      i--;
    } else if (j > 0 && d[i][j] === d[i][j - 1] + 1) {
      ops.push({ kind: 'extra', actual: b[j - 1] });
      j--;
    } else {
      ops.push({ kind: 'sub', expected: a[i - 1], actual: b[j - 1] });
      i--;
      j--;
    }
  }
  return ops.reverse();
}

/** Score sur 100 : mots justes, demi-point pour un accent manquant, les mots en trop pénalisent. */
export function scoreDiff(ops: readonly DiffOp[]): number {
  let expected = 0;
  let extra = 0;
  let points = 0;
  for (const op of ops) {
    if (op.kind === 'extra') {
      extra++;
      continue;
    }
    expected++;
    if (op.kind === 'ok') points += 1;
    if (op.kind === 'accent') points += 0.5;
  }
  if (expected === 0) return extra === 0 ? 100 : 0;
  return Math.round((100 * points) / (expected + extra));
}

export type AnswerCheck = 'correct' | 'accent' | 'wrong';

/** Vérifie une réponse courte (exercice à trous) contre la liste des réponses acceptées. */
export function checkAnswer(input: string, accepted: readonly string[]): AnswerCheck {
  const typed = tokenize(input).join(' ');
  const answers = accepted.map((answer) => tokenize(answer).join(' '));
  if (answers.includes(typed)) return 'correct';
  if (answers.some((answer) => stripAccents(answer) === stripAccents(typed))) return 'accent';
  return 'wrong';
}
