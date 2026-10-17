import { useCallback, useEffect, useMemo, useState } from 'react';
import { MINUTE } from '../../core/dates.ts';
import type { QueueItem } from '../../core/srs/queue.ts';
import { sessionOrder } from '../../core/srs/queue.ts';
import { GRADES, newCardState, previewDelays, schedule } from '../../core/srs/scheduler.ts';
import type { Grade } from '../../core/srs/scheduler.ts';
import { repo } from '../../data/repo.ts';
import { useProfile } from '../../app/context.ts';
import { AudioButton } from '../../ui/AudioButton.tsx';
import { Page } from '../../ui/Page.tsx';
import { loadStudySnapshot } from './studyData.ts';
import { findExamples } from '../../core/text/examples.ts';
import { sentencePool } from '../practice/sentences.ts';
import { ExampleLine } from '../../ui/WordSheet.tsx';

/** Les cartes qui reviennent dans moins de 20 minutes restent dans la séance en cours. */
const LEARN_AHEAD = 20 * MINUTE;

const GRADE_LABELS: Record<Grade, string> = { again: 'À revoir', hard: 'Difficile', good: 'Correct', easy: 'Facile' };

export function ReviewPage() {
  const { level } = useProfile();
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStudySnapshot(level).then(({ queue }) => setQueue(sessionOrder(queue)));
  }, [level]);

  const current = queue?.[0];

  const grade = useCallback(
    async (g: Grade) => {
      if (!current || saving) return;
      setSaving(true);
      const now = Date.now();
      const before = current.state ?? newCardState(current.cardId, now);
      const after = schedule(before, g, now);
      await repo.recordReview(before, after, g, now);
      setQueue((items) => {
        const rest = (items ?? []).slice(1);
        return after.due - now <= LEARN_AHEAD ? [...rest, { ...current, state: after }] : rest;
      });
      setReviewed((n) => n + 1);
      setRevealed(false);
      setSaving(false);
    },
    [current, saving],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!current || event.target instanceof HTMLInputElement) return;
      if (!revealed && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault();
        setRevealed(true);
      } else if (revealed && ['1', '2', '3', '4'].includes(event.key)) {
        grade(GRADES[Number(event.key) - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, revealed, grade]);

  if (!queue) return <div className="loading" aria-busy="true" />;

  if (!current) {
    return (
      <Page title="Cartes" back="/cartes" line="cartes">
        <div className="empty">
          <p className="empty__title">{reviewed > 0 ? `Séance terminée : ${reviewed} réponses.` : 'Rien à réviser pour le moment.'}</p>
          <p className="muted">Les prochaines cartes reviendront quand il sera temps de les revoir. Tu peux ajouter des mots ou augmenter le nombre de nouvelles cartes par jour dans ton profil.</p>
          <a className="btn btn--primary btn--block" href="#/">
            Retour à l’accueil
          </a>
        </div>
      </Page>
    );
  }

  const { note, direction } = current;
  const state = current.state ?? newCardState(current.cardId, Date.now());
  const delays = previewDelays(state, Date.now());
  const counts = {
    fresh: queue.filter((i) => !i.state || i.state.phase === 'new').length,
    learning: queue.filter((i) => i.state && (i.state.phase === 'learning' || i.state.phase === 'relearning')).length,
    review: queue.filter((i) => i.state?.phase === 'review').length,
  };

  return (
    <Page title="Cartes" back="/cartes" line="cartes" aside={<Counts {...counts} />}>
      <article className="flash" aria-live="polite">
        <p className="flash__hint">{direction === 'rec' ? 'Que signifie ce mot ?' : 'Comment dit-on en italien ?'}</p>
        {direction === 'rec' ? (
          <p className="flash__front it" lang="it">
            {note.it}
          </p>
        ) : (
          <p className="flash__front">{note.fr}</p>
        )}
        {direction === 'rec' && <AudioButton text={note.it} variant="icon" />}

        {revealed && (
          <div className="flash__back">
            {direction === 'rec' ? (
              <p className="flash__answer">{note.fr}</p>
            ) : (
              <div className="flash__answer-row">
                <p className="flash__answer it" lang="it">
                  {note.it}
                </p>
                <AudioButton text={note.it} variant="icon" />
              </div>
            )}
            {note.example && (
              <div className="flash__example">
                <p className="it" lang="it">
                  {note.example}
                </p>
                <p className="muted">{note.exampleFr}</p>
                <AudioButton text={note.example} label="Écouter l’exemple" />
              </div>
            )}
            <OtherExamples it={note.it} known={note.example} />
          </div>
        )}
      </article>

      {revealed ? (
        <div className="grades">
          {GRADES.map((g) => (
            <button key={g} type="button" className={`grade grade--${g}`} onClick={() => grade(g)} disabled={saving}>
              <span>{GRADE_LABELS[g]}</span>
              <small>{delays[g]}</small>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="btn btn--primary btn--block" onClick={() => setRevealed(true)}>
          Afficher la réponse
        </button>
      )}
    </Page>
  );
}

function Counts({ fresh, learning, review }: { fresh: number; learning: number; review: number }) {
  return (
    <p className="counts" aria-label={`${fresh} nouvelles, ${learning} en apprentissage, ${review} à revoir`}>
      <span className="counts__fresh" title="Nouvelles">
        {fresh}
      </span>
      <span className="counts__learning" title="En apprentissage">
        {learning}
      </span>
      <span className="counts__review" title="À revoir">
        {review}
      </span>
    </p>
  );
}

/** Deux autres phrases de l'application qui emploient le mot, quand il y en a. */
function OtherExamples({ it, known }: { it: string; known?: string }) {
  const others = useMemo(() => findExamples(it, sentencePool, 2, known ? [known] : []), [it, known]);
  if (others.length === 0) return null;
  return (
    <div className="example-block example-block--card">
      <h3>Autres exemples</h3>
      {others.map((s) => (
        <ExampleLine key={s.id} it={s.it} fr={s.fr} />
      ))}
    </div>
  );
}
