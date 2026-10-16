import { useState } from 'react';
import type { FormEvent } from 'react';
import { LEVELS } from '../../core/cefr.ts';
import type { Level } from '../../core/cefr.ts';
import { cardId } from '../../core/srs/queue.ts';
import { decks } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';
import { useProfile } from '../../app/context.ts';
import { useLive } from '../../lib/live.ts';
import { Icon } from '../../ui/Icon.tsx';
import { Page } from '../../ui/Page.tsx';
import { loadStudySnapshot } from './studyData.ts';

export function CardsPage() {
  const { level } = useProfile();
  const data = useLive(async () => {
    const [snapshot, userNotes] = await Promise.all([loadStudySnapshot(level), repo.getUserNotes()]);
    return { snapshot, userNotes };
  }, [level]);

  if (!data) return <div className="loading" aria-busy="true" />;
  const { queue, states } = data.snapshot;
  const due = queue.learning.length + queue.review.length;
  const learned = [...states.values()].filter((s) => s.phase === 'review').length;

  return (
    <Page title="Cartes" line="cartes">
      <dl className="stats">
        <div>
          <dt>À revoir</dt>
          <dd>{due}</dd>
        </div>
        <div>
          <dt>Nouvelles</dt>
          <dd>{queue.fresh.length}</dd>
        </div>
        <div>
          <dt>Acquises</dt>
          <dd>{learned}</dd>
        </div>
      </dl>
      <a className="btn btn--primary btn--block" href="#/cartes/session">
        Commencer la séance
      </a>

      <section className="section">
        <h2>Paquets</h2>
        <ul className="rows">
          {decks.map((deck) => {
            const seen = deck.notes.filter((n) => states.has(cardId(n.id, 'rec'))).length;
            return (
              <li key={deck.id} className="row row--static">
                <span className="chip">{deck.level}</span>
                <span className="row__body">
                  <span className="row__title">{deck.title}</span>
                  <span className="row__meta">
                    {seen} sur {deck.notes.length} mots commencés
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="section">
        <h2>Mes mots</h2>
        <p className="muted small">Les mots que tu ajoutes ici ou depuis une lecture passent en priorité dans tes nouvelles cartes.</p>
        <AddWordForm defaultLevel={level} />
        {data.userNotes.length > 0 && (
          <ul className="rows">
            {data.userNotes.map((note) => (
              <li key={note.id} className="row row--static">
                <span className="row__body">
                  <span className="row__title it" lang="it">
                    {note.it}
                  </span>
                  <span className="row__meta">{note.fr}</span>
                </span>
                <button type="button" className="icon-btn" onClick={() => repo.deleteUserNote(note.id)} aria-label={`Supprimer ${note.it}`}>
                  <Icon name="close" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}

function AddWordForm({ defaultLevel }: { defaultLevel: Level }) {
  const [it, setIt] = useState('');
  const [fr, setFr] = useState('');
  const [level, setLevel] = useState<Level>(defaultLevel);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!it.trim() || !fr.trim()) return;
    await repo.addUserNote({ id: `u-${Date.now().toString(36)}`, level, it: it.trim(), fr: fr.trim(), createdAt: Date.now(), source: 'manuel' });
    setIt('');
    setFr('');
  };

  return (
    <form className="add-word" onSubmit={submit}>
      <label>
        <span>Italien</span>
        <input value={it} onChange={(e) => setIt(e.target.value)} lang="it" autoCapitalize="off" required />
      </label>
      <label>
        <span>Français</span>
        <input value={fr} onChange={(e) => setFr(e.target.value)} required />
      </label>
      <label>
        <span>Niveau</span>
        <select value={level} onChange={(e) => setLevel(e.target.value as Level)}>
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn">
        <Icon name="plus" size={18} /> Ajouter
      </button>
    </form>
  );
}
