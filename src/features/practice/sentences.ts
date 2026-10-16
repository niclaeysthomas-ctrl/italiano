import { buildSentencePool } from '../../core/practice/pool.ts';
import { contentNotes, readings } from '../../content/index.ts';

/** Phrases disponibles pour la dictée et l'oral, calculées une fois au chargement. */
export const sentencePool = buildSentencePool(contentNotes, readings);
