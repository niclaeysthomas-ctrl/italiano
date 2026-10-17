import { buildSentencePool } from '../../core/practice/pool.ts';
import type { PracticeSentence } from '../../core/practice/pool.ts';
import { contentNotes, everydayTopics, readings } from '../../content/index.ts';

/** Phrases des situations du quotidien (dialogues et exemples), sauf celles marquées `practice: false`. */
const everydaySentences: PracticeSentence[] = everydayTopics
  .filter((topic) => topic.practice !== false)
  .flatMap((topic) => [
    ...topic.dialogue.map((line, i) => ({ id: `qd:${topic.id}:${i}`, level: topic.level, it: line.it, fr: line.fr })),
    ...topic.items
      .filter((item) => item.example)
      .map((item, i) => ({ id: `qe:${topic.id}:${i}`, level: topic.level, it: item.example!, fr: item.exampleFr })),
  ]);

/** Phrases disponibles pour la dictée, la traduction et l'oral, calculées une fois au chargement. */
export const sentencePool: PracticeSentence[] = [
  ...buildSentencePool(contentNotes, readings),
  ...everydaySentences.filter((s) => s.it.split(/\s+/).length >= 3 && s.it.split(/\s+/).length <= 18),
];
