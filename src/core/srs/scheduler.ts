/**
 * Planificateur de répétition espacée inspiré de l'algorithme SM-2 tel qu'Anki l'applique :
 * étapes d'apprentissage en minutes, puis intervalles en jours multipliés par un facteur de facilité.
 *
 * Module pur (aucun accès au navigateur) : il peut être remplacé plus tard par FSRS
 * sans toucher au reste de l'application, tant que la signature de `schedule` est conservée.
 */
import { DAY, MINUTE, addDays, dayStart, studyDay } from '../dates.ts';

export type Grade = 'again' | 'hard' | 'good' | 'easy';
export const GRADES: readonly Grade[] = ['again', 'hard', 'good', 'easy'];

export type Phase = 'new' | 'learning' | 'review' | 'relearning';

export interface CardState {
  id: string;
  phase: Phase;
  /** Étape en cours pendant l'apprentissage ou le réapprentissage. */
  step: number;
  /** Facteur de facilité (2,5 correspond à 250 % dans Anki). */
  ease: number;
  /** Intervalle courant en jours. */
  interval: number;
  /** Prochaine échéance, en millisecondes. */
  due: number;
  reps: number;
  lapses: number;
  lastReview: number | null;
}

export interface SchedulerConfig {
  /** Étapes d'apprentissage, en minutes. */
  learningSteps: number[];
  /** Étapes de réapprentissage après un oubli, en minutes. */
  relearningSteps: number[];
  /** Intervalle (jours) quand une carte termine ses étapes. */
  graduatingInterval: number;
  /** Intervalle (jours) quand on répond « Facile » à une carte en apprentissage. */
  easyInterval: number;
  startingEase: number;
  minEase: number;
  hardMultiplier: number;
  easyBonus: number;
  /** Part de l'ancien intervalle conservée après un oubli (0 = repartir à 1 jour). */
  lapseMultiplier: number;
  maxInterval: number;
}

export const DEFAULT_CONFIG: SchedulerConfig = {
  learningSteps: [1, 10],
  relearningSteps: [10],
  graduatingInterval: 1,
  easyInterval: 4,
  startingEase: 2.5,
  minEase: 1.3,
  hardMultiplier: 1.2,
  easyBonus: 1.3,
  lapseMultiplier: 0,
  maxInterval: 36500,
};

export function newCardState(id: string, now: number, cfg: SchedulerConfig = DEFAULT_CONFIG): CardState {
  return { id, phase: 'new', step: 0, ease: cfg.startingEase, interval: 0, due: now, reps: 0, lapses: 0, lastReview: null };
}

/** Échéance d'une révision dans `days` jours, calée sur la bascule de 4 h du matin. */
export function reviewDue(now: number, days: number): number {
  return dayStart(addDays(studyDay(now), days));
}

export function schedule(card: CardState, grade: Grade, now: number, cfg: SchedulerConfig = DEFAULT_CONFIG): CardState {
  const next: CardState = { ...card, reps: card.reps + 1, lastReview: now };
  return card.phase === 'review' ? scheduleReview(next, card, grade, now, cfg) : scheduleSteps(next, card, grade, now, cfg);
}

function scheduleSteps(next: CardState, card: CardState, grade: Grade, now: number, cfg: SchedulerConfig): CardState {
  const relearning = card.phase === 'relearning';
  const steps = relearning ? cfg.relearningSteps : cfg.learningSteps;
  const phase: Phase = relearning ? 'relearning' : 'learning';
  const graduate = (interval: number): CardState => ({
    ...next,
    phase: 'review',
    step: 0,
    interval,
    due: reviewDue(now, interval),
  });
  const graduatingInterval = relearning ? Math.max(1, card.interval) : cfg.graduatingInterval;

  if (steps.length === 0) {
    return graduate(grade === 'easy' && !relearning ? cfg.easyInterval : graduatingInterval);
  }

  const step = card.phase === 'new' ? 0 : Math.min(card.step, steps.length - 1);

  switch (grade) {
    case 'again':
      return { ...next, phase, step: 0, due: now + steps[0] * MINUTE };
    case 'hard': {
      let delay = steps[step];
      if (step === 0) delay = steps.length > 1 ? (steps[0] + steps[1]) / 2 : steps[0] * 1.5;
      return { ...next, phase, step, due: now + delay * MINUTE };
    }
    case 'good':
      if (step + 1 < steps.length) return { ...next, phase, step: step + 1, due: now + steps[step + 1] * MINUTE };
      return graduate(graduatingInterval);
    case 'easy':
      return graduate(relearning ? graduatingInterval + 1 : cfg.easyInterval);
  }
}

function scheduleReview(next: CardState, card: CardState, grade: Grade, now: number, cfg: SchedulerConfig): CardState {
  const daysLate = Math.max(0, Math.floor((now - card.due) / DAY));
  const interval = Math.max(1, card.interval);
  const clamp = (days: number) => Math.min(cfg.maxInterval, Math.max(1, Math.round(days)));

  if (grade === 'again') {
    const ease = Math.max(cfg.minEase, card.ease - 0.2);
    const lapses = card.lapses + 1;
    const reduced = clamp(interval * cfg.lapseMultiplier);
    if (cfg.relearningSteps.length === 0) {
      return { ...next, ease, lapses, interval: reduced, due: reviewDue(now, reduced) };
    }
    return { ...next, phase: 'relearning', step: 0, ease, lapses, interval: reduced, due: now + cfg.relearningSteps[0] * MINUTE };
  }

  const hard = clamp(Math.max(interval + 1, (interval + daysLate / 4) * cfg.hardMultiplier));
  if (grade === 'hard') {
    return { ...next, ease: Math.max(cfg.minEase, card.ease - 0.15), interval: hard, due: reviewDue(now, hard) };
  }

  const good = clamp(Math.max(hard + 1, (interval + daysLate / 2) * card.ease));
  if (grade === 'good') {
    return { ...next, interval: good, due: reviewDue(now, good) };
  }

  const easy = clamp(Math.max(good + 1, (interval + daysLate) * card.ease * cfg.easyBonus));
  return { ...next, ease: card.ease + 0.15, interval: easy, due: reviewDue(now, easy) };
}

/** Libellé court d'un délai : « 1 min », « 3 h », « 12 j », « 2 mois », « 1,5 an ». */
export function formatDelay(state: CardState, now: number): string {
  if (state.phase === 'review') return formatDays(state.interval);
  const minutes = Math.max(1, Math.round((state.due - now) / MINUTE));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h` : formatDays(Math.round(hours / 24));
}

export function formatDays(days: number): string {
  if (days < 30) return `${days} j`;
  if (days < 365) return `${Math.round(days / 30)} mois`;
  const years = Math.round((days / 365) * 10) / 10;
  return `${String(years).replace('.', ',')} an${years >= 2 ? 's' : ''}`;
}

/** Délai obtenu pour chaque réponse possible, pour l'afficher sous les boutons. */
export function previewDelays(card: CardState, now: number, cfg: SchedulerConfig = DEFAULT_CONFIG): Record<Grade, string> {
  const labels = {} as Record<Grade, string>;
  for (const grade of GRADES) labels[grade] = formatDelay(schedule(card, grade, now, cfg), now);
  return labels;
}
