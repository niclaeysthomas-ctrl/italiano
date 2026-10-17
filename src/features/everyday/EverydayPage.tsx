import { studyDay } from '../../core/dates.ts';
import { everydayTopics } from '../../content/index.ts';
import { AudioButton } from '../../ui/AudioButton.tsx';
import { Icon } from '../../ui/Icon.tsx';
import { Page } from '../../ui/Page.tsx';
import { expressionOfTheDay } from './daily.ts';

export function EverydayPage() {
  const daily = expressionOfTheDay(studyDay());

  return (
    <Page title="L’italien du quotidien" line="quotidien" intro={<p>Les phrases qu’on entend vraiment, situation par situation, avec un dialogue à écouter.</p>}>
      {daily && (
        <section className="daily-expr" aria-labelledby="expr-title">
          <h2 id="expr-title" className="small muted">
            Expression du jour
          </h2>
          <div className="daily-expr__row">
            <p className="daily-expr__it it" lang="it">
              {daily.item.it}
            </p>
            <AudioButton text={daily.item.it} variant="icon" />
          </div>
          <p className="daily-expr__fr">{daily.item.fr}</p>
          {daily.item.example && (
            <p className="small">
              <span className="it" lang="it">
                {daily.item.example}
              </span>
              <br />
              <span className="muted">{daily.item.exampleFr}</span>
            </p>
          )}
          <a className="btn btn--small" href={`#/quotidien/${daily.topic.id}`}>
            Voir la situation : {daily.topic.title.toLowerCase()}
          </a>
        </section>
      )}

      <section className="section" aria-labelledby="situations">
        <h2 id="situations">Situations</h2>
        <ul className="rows">
          {everydayTopics.map((topic) => (
            <li key={topic.id}>
              <a className="row" href={`#/quotidien/${topic.id}`}>
                <span className="chip">{topic.level}</span>
                <span className="row__body">
                  <span className="row__title">{topic.title}</span>
                  <span className="row__meta">
                    {topic.items.length} expressions, un dialogue
                  </span>
                </span>
                <span className="row__end">
                  <Icon name="chevron" size={18} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
