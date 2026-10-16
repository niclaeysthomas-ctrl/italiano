import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { studyDay } from '../../core/dates.ts';
import { pickDaily } from '../../core/daily/pick.ts';
import type { Reading } from '../../core/content/types.ts';
import { findReading, readings } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';
import { useProfile } from '../../app/context.ts';
import { useLive } from '../../lib/live.ts';
import { AudioButton } from '../../ui/AudioButton.tsx';
import { Choices } from '../../ui/Choices.tsx';
import { Icon } from '../../ui/Icon.tsx';
import { Page } from '../../ui/Page.tsx';

type GlossaryEntry = Reading['glossary'][number];

export function ReadingPage({ id }: { id?: string }) {
  const { level } = useProfile();
  const reading = id ? findReading(id) : pickDaily(readings, studyDay(), level);
  if (!reading) {
    return (
      <Page title="Lecture" back="/pratique" line="lecture">
        <p>Aucune lecture disponible pour l’instant.</p>
      </Page>
    );
  }
  return <ReadingView key={reading.id} reading={reading} />;
}

function ReadingView({ reading }: { reading: Reading }) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [entry, setEntry] = useState<GlossaryEntry | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() => reading.questions.map(() => null));
  const [logged, setLogged] = useState(false);
  const savedIds = useLive(async () => new Set((await repo.getUserNotes()).map((n) => n.id)));

  const paragraphs = reading.text.split(/\n\s*\n/);
  const translations = reading.translation?.split(/\n\s*\n/) ?? [];
  const highlighter = useMemo(() => buildHighlighter(reading.glossary), [reading]);

  const answer = (q: number, index: number) => {
    const next = answers.map((a, i) => (i === q ? index : a));
    setAnswers(next);
    if (!logged && next.every((a) => a !== null)) {
      const correct = next.filter((a, i) => a === reading.questions[i].answer).length;
      setLogged(true);
      void repo.logAttempt({ kind: 'reading', refId: reading.id, score: (100 * correct) / reading.questions.length });
    }
  };

  const noteId = (term: string) => `lect-${reading.id}-${term.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-')}`;

  return (
    <Page title={reading.title} back="/pratique" line="lecture" aside={<span className="chip">{reading.level}</span>}>
      <div className="toolbar">
        <AudioButton text={reading.text} label="Écouter le texte" />
        <button type="button" className="btn btn--small" aria-pressed={showTranslation} onClick={() => setShowTranslation((v) => !v)}>
          {showTranslation ? 'Masquer la traduction' : 'Afficher la traduction'}
        </button>
      </div>
      <p className="muted small">Touche un mot souligné pour voir sa traduction.</p>

      <div className="reading">
        {paragraphs.map((paragraph, i) => (
          <div key={i} className="reading__para">
            <p className="it" lang="it">
              {highlighter(paragraph, setEntry)}
            </p>
            {showTranslation && translations[i] && <p className="reading__translation">{translations[i]}</p>}
          </div>
        ))}
      </div>

      <section className="section" aria-labelledby="comprehension">
        <h2 id="comprehension">Compréhension</h2>
        <ol className="exercises">
          {reading.questions.map((question, q) => (
            <li key={q} className="exercise">
              <p className="exercise__prompt">{question.q}</p>
              <Choices options={question.options} selected={answers[q]} answer={question.answer} onSelect={(i) => answer(q, i)} />
            </li>
          ))}
        </ol>
      </section>

      {entry && (
        <GlossarySheet
          entry={entry}
          saved={savedIds?.has(noteId(entry.term)) ?? false}
          onSave={() =>
            repo.addUserNote({ id: noteId(entry.term), level: reading.level, it: entry.term, fr: entry.fr, source: reading.id, createdAt: Date.now() })
          }
          onClose={() => setEntry(null)}
        />
      )}
    </Page>
  );
}

/** Repère les termes du glossaire dans un paragraphe et les rend cliquables (le plus long d'abord). */
type Highlighter = (text: string, onPick: (entry: GlossaryEntry) => void) => ReactNode;

function buildHighlighter(glossary: readonly GlossaryEntry[]): Highlighter {
  if (glossary.length === 0) return (text) => text;
  const sorted = [...glossary].sort((a, b) => b.term.length - a.term.length);
  const escaped = sorted.map((g) => g.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(?<![\\p{L}])(${escaped.join('|')})(?![\\p{L}])`, 'giu');
  const byTerm = new Map(sorted.map((g) => [g.term.toLowerCase(), g]));

  return (text, onPick) => {
    const parts: ReactNode[] = [];
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      const start = match.index ?? 0;
      if (start > last) parts.push(text.slice(last, start));
      const found = byTerm.get(match[0].toLowerCase());
      parts.push(
        found ? (
          <button key={start} type="button" className="term" onClick={() => onPick(found)}>
            {match[0]}
          </button>
        ) : (
          match[0]
        ),
      );
      last = start + match[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };
}

function GlossarySheet({ entry, saved, onSave, onClose }: { entry: GlossaryEntry; saved: boolean; onSave: () => void; onClose: () => void }) {
  return (
    <div className="sheet-layer" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-term" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <p id="sheet-term" className="sheet__term it" lang="it">
            {entry.term}
          </p>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="close" />
          </button>
        </div>
        <p className="sheet__fr">{entry.fr}</p>
        <div className="toolbar">
          <AudioButton text={entry.term} />
          <button type="button" className="btn btn--small" onClick={onSave} disabled={saved}>
            {saved ? 'Dans mes cartes' : 'Ajouter à mes cartes'}
          </button>
        </div>
      </div>
    </div>
  );
}
