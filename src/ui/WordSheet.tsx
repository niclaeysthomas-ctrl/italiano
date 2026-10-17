import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { findExamples } from '../core/text/examples.ts';
import { sentencePool } from '../features/practice/sentences.ts';
import { AudioButton } from './AudioButton.tsx';
import { Icon } from './Icon.tsx';

export interface WordEntry {
  it: string;
  fr: string;
  note?: string;
  example?: string;
  exampleFr?: string;
}

interface Props {
  entry: WordEntry;
  onClose: () => void;
  /** Bouton d'action (ajout aux cartes, etc.). */
  action?: ReactNode;
  /** Ligne d'information sous la traduction (niveau, paquet…). */
  meta?: ReactNode;
}

/** Fiche détaillée d'un mot : traduction, note, exemple principal et autres phrases de l'application qui l'emploient. */
export function WordSheet({ entry, onClose, action, meta }: Props) {
  const others = useMemo(() => findExamples(entry.it, sentencePool, 3, entry.example ? [entry.example] : []), [entry]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-layer" onClick={onClose}>
      <div className="sheet sheet--tall" role="dialog" aria-modal="true" aria-labelledby="word-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <p id="word-title" className="sheet__term it" lang="it">
            {entry.it}
          </p>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="close" />
          </button>
        </div>
        <p className="sheet__fr">{entry.fr}</p>
        {meta && <p className="muted small">{meta}</p>}
        {entry.note && <p className="callout callout--tip small">{entry.note}</p>}
        <div className="toolbar">
          <AudioButton text={entry.it} />
          {action}
        </div>

        {entry.example && (
          <div className="example-block">
            <h3>Exemple</h3>
            <ExampleLine it={entry.example} fr={entry.exampleFr} />
          </div>
        )}
        {others.length > 0 && (
          <div className="example-block">
            <h3>Ailleurs dans l’application</h3>
            {others.map((s) => (
              <ExampleLine key={s.id} it={s.it} fr={s.fr} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ExampleLine({ it, fr }: { it: string; fr?: string }) {
  return (
    <div className="example-line">
      <div>
        <p className="it" lang="it">
          {it}
        </p>
        {fr && <p className="muted small">{fr}</p>}
      </div>
      <AudioButton text={it} variant="icon" />
    </div>
  );
}
