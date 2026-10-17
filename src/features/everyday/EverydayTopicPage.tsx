import { useState } from 'react';
import type { EverydayItem } from '../../core/content/types.ts';
import { findEverydayTopic } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';
import { useLive } from '../../lib/live.ts';
import { AudioButton } from '../../ui/AudioButton.tsx';
import { Icon } from '../../ui/Icon.tsx';
import { Page } from '../../ui/Page.tsx';
import { WordSheet } from '../../ui/WordSheet.tsx';
import { everydayNoteId } from './daily.ts';

export function EverydayTopicPage({ id }: { id: string }) {
  const topic = findEverydayTopic(id);
  const [showFr, setShowFr] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const saved = useLive(async () => new Set((await repo.getUserNotes()).map((n) => n.id)));

  if (!topic) {
    return (
      <Page title="Situation introuvable" back="/quotidien" line="quotidien">
        <p>Cette situation n’existe pas ou a été renommée.</p>
      </Page>
    );
  }

  const fullDialogue = topic.dialogue.map((line) => line.it).join(' ');
  const save = (item: EverydayItem, index: number) =>
    repo.addUserNote({
      id: everydayNoteId(topic.id, index),
      level: topic.level,
      it: item.it,
      fr: item.fr,
      example: item.example,
      exampleFr: item.exampleFr,
      source: topic.id,
      createdAt: Date.now(),
    });

  const openItem = open !== null ? topic.items[open] : null;
  const isSaved = (index: number) => saved?.has(everydayNoteId(topic.id, index)) ?? false;

  return (
    <Page title={topic.title} back="/quotidien" line="quotidien" aside={<span className="chip">{topic.level}</span>} intro={<p>{topic.intro}</p>}>
      <section className="section" aria-labelledby="dialogue">
        <h2 id="dialogue">Dialogue</h2>
        <div className="toolbar">
          <AudioButton text={fullDialogue} label="Écouter le dialogue" />
          <button type="button" className="btn btn--small" aria-pressed={showFr} onClick={() => setShowFr((v) => !v)}>
            {showFr ? 'Masquer la traduction' : 'Afficher la traduction'}
          </button>
        </div>
        <ol className="dialogue">
          {topic.dialogue.map((line, i) => (
            <li key={i} className={`dialogue__line${i % 2 ? ' is-right' : ''}`}>
              <span className="dialogue__who">{line.who}</span>
              <div className="dialogue__bubble">
                <p className="it" lang="it">
                  {line.it}
                </p>
                {showFr && <p className="muted small">{line.fr}</p>}
              </div>
              <AudioButton text={line.it} variant="icon" label={`Écouter : ${line.it}`} />
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="expressions">
        <h2 id="expressions">Expressions</h2>
        <p className="muted small">Touche une expression pour voir ses exemples. Le + l’ajoute à tes cartes.</p>
        <ul className="rows">
          {topic.items.map((item, index) => (
            <li key={item.it} className="row row--split">
              <button type="button" className="row__main" onClick={() => setOpen(index)}>
                <span className="row__body">
                  <span className="row__title it" lang="it">
                    {item.it}
                  </span>
                  <span className="row__meta row__meta--wrap">{item.fr}</span>
                </span>
              </button>
              <button
                type="button"
                className={`icon-btn${isSaved(index) ? ' is-on' : ''}`}
                onClick={() => save(item, index)}
                disabled={isSaved(index)}
                aria-label={isSaved(index) ? `${item.it} : déjà dans tes cartes` : `Ajouter ${item.it} à mes cartes`}
              >
                <Icon name={isSaved(index) ? 'check' : 'plus'} size={20} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {openItem && open !== null && (
        <WordSheet
          entry={openItem}
          onClose={() => setOpen(null)}
          action={
            <button type="button" className="btn btn--small" onClick={() => save(openItem, open)} disabled={isSaved(open)}>
              {isSaved(open) ? 'Dans mes cartes' : 'Ajouter à mes cartes'}
            </button>
          }
        />
      )}
    </Page>
  );
}
