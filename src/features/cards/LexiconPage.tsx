import { useMemo, useState } from 'react';
import { LEVELS } from '../../core/cefr.ts';
import type { Level } from '../../core/cefr.ts';
import { cardId } from '../../core/srs/queue.ts';
import type { StudyNote } from '../../core/srs/queue.ts';
import { stripAccents } from '../../core/text/compare.ts';
import { contentNotes, decks } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';
import { useLive } from '../../lib/live.ts';
import { Icon } from '../../ui/Icon.tsx';
import { Page } from '../../ui/Page.tsx';
import { WordSheet } from '../../ui/WordSheet.tsx';

const MAX_RESULTS = 60;

const fold = (value: string) => stripAccents(value.toLowerCase());

/** Lexique : tous les mots de l'application, consultables avec leurs exemples. `deckId` restreint à un paquet. */
export function LexiconPage({ deckId }: { deckId?: string }) {
  const deck = deckId ? decks.find((d) => d.id === deckId) : undefined;
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [open, setOpen] = useState<StudyNote | null>(null);
  const states = useLive(() => repo.getCardStates());
  const userNotes = useLive(() => repo.getUserNotes());

  const source: StudyNote[] = useMemo(() => {
    if (deck) return deck.notes.map((n) => ({ ...n, level: n.level ?? deck.level }));
    return [...(userNotes ?? []), ...contentNotes];
  }, [deck, userNotes]);

  const results = useMemo(() => {
    const q = fold(query.trim());
    return source.filter((note) => (level === 'all' || note.level === level) && (!q || fold(note.it).includes(q) || fold(note.fr).includes(q)));
  }, [source, query, level]);

  const status = (note: StudyNote) => {
    const state = states?.get(cardId(note.id, 'rec'));
    if (!state) return 'Pas encore vu';
    return state.phase === 'review' ? 'Acquis' : 'En apprentissage';
  };

  return (
    <Page
      title={deck ? deck.title : 'Lexique'}
      back="/cartes"
      line="cartes"
      aside={deck ? <span className="chip">{deck.level}</span> : undefined}
      intro={<p>{deck ? deck.description : 'Cherche un mot en italien ou en français, et ouvre-le pour voir ses exemples.'}</p>}
    >
      <div className="search">
        <label className="search__field">
          <Icon name="search" size={18} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher un mot" aria-label="Chercher un mot" autoCapitalize="off" />
        </label>
        {!deck && (
          <fieldset className="segmented segmented--small">
            <legend className="visually-hidden">Niveau</legend>
            {(['all', ...LEVELS] as const).map((l) => (
              <label key={l} className={level === l ? 'is-active' : undefined}>
                <input type="radio" name="lex-level" checked={level === l} onChange={() => setLevel(l)} />
                {l === 'all' ? 'Tous' : l}
              </label>
            ))}
          </fieldset>
        )}
      </div>

      <p className="muted small" role="status">
        {results.length === 0 ? 'Aucun mot ne correspond.' : `${results.length} mot${results.length > 1 ? 's' : ''}`}
        {results.length > MAX_RESULTS && `, les ${MAX_RESULTS} premiers affichés`}
      </p>

      {results.length > 0 && (
        <ul className="rows">
          {results.slice(0, MAX_RESULTS).map((note) => (
            <li key={note.id}>
              <button type="button" className="row row--button" onClick={() => setOpen(note)}>
                {!deck && <span className="chip">{note.level}</span>}
                <span className="row__body">
                  <span className="row__title it" lang="it">
                    {note.it}
                  </span>
                  <span className="row__meta">{note.fr}</span>
                </span>
                <span className="row__end">
                  <Icon name="chevron" size={18} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && <WordSheet entry={open} onClose={() => setOpen(null)} meta={`Niveau ${open.level}. ${status(open)}.`} />}
    </Page>
  );
}
