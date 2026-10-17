import type { EverydayItem, EverydayTopic } from '../../core/content/types.ts';
import { hashString } from '../../core/random.ts';
import { everydayTopics } from '../../content/index.ts';

export interface DailyExpression {
  topic: EverydayTopic;
  item: EverydayItem;
  index: number;
}

const all: DailyExpression[] = everydayTopics.flatMap((topic) => topic.items.map((item, index) => ({ topic, item, index })));

/** Une expression par jour, la même toute la journée, tirée de toutes les situations. */
export function expressionOfTheDay(day: string): DailyExpression | undefined {
  if (all.length === 0) return undefined;
  return all[hashString(`expr:${day}`) % all.length];
}

export function everydayNoteId(topicId: string, index: number): string {
  return `q-${topicId}-${index}`;
}
