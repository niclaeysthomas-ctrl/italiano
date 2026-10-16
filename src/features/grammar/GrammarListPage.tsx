import { LEVELS, LEVEL_NAMES } from '../../core/cefr.ts';
import { lessons } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';
import { useProfile } from '../../app/context.ts';
import { useLive } from '../../lib/live.ts';
import { Icon } from '../../ui/Icon.tsx';
import { Page } from '../../ui/Page.tsx';

export function GrammarListPage() {
  const { level } = useProfile();
  const best = useLive(async () => {
    const attempts = await repo.getAttempts();
    const scores = new Map<string, number>();
    for (const a of attempts) if (a.kind === 'grammar') scores.set(a.refId, Math.max(a.score, scores.get(a.refId) ?? 0));
    return scores;
  });

  return (
    <Page title="Grammaire" line="grammaire" intro={<p>Une leçon courte, puis quelques exercices corrigés. Les leçons de ton niveau sont mises en avant.</p>}>
      {LEVELS.map((l) => {
        const items = lessons.filter((lesson) => lesson.level === l);
        return (
          <section key={l} className={`section${l === level ? ' is-current' : ''}`} aria-labelledby={`lv-${l}`}>
            <h2 id={`lv-${l}`}>
              {l}, {LEVEL_NAMES[l].toLowerCase()}
              {l === level && <span className="tag">Ton niveau</span>}
            </h2>
            {items.length === 0 ? (
              <p className="muted small">Leçons à venir.</p>
            ) : (
              <ul className="rows">
                {items.map((lesson) => {
                  const score = best?.get(lesson.id);
                  return (
                    <li key={lesson.id}>
                      <a className="row" href={`#/grammaire/${lesson.id}`}>
                        <span className="row__body">
                          <span className="row__title">{lesson.title}</span>
                          <span className="row__meta">{score === undefined ? lesson.summary : `Meilleur score : ${score} %`}</span>
                        </span>
                        <span className="row__end">
                          {score !== undefined && score >= 70 ? <Icon name="check" label="Leçon réussie" /> : <Icon name="chevron" size={18} />}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </Page>
  );
}
