import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { drawSentences } from '../../core/practice/pool.ts';
import { mulberry32 } from '../../core/random.ts';
import { diffWords, scoreDiff, tokenize } from '../../core/text/compare.ts';
import { repo } from '../../data/repo.ts';
import { useProfile } from '../../app/context.ts';
import { AudioButton } from '../../ui/AudioButton.tsx';
import { Page } from '../../ui/Page.tsx';
import { ScoreBadge, WordDiff } from '../../ui/WordDiff.tsx';
import { sentencePool } from './sentences.ts';

const SESSION_SIZE = 8;

/** Phrases traduisibles : celles qui ont une traduction française. */
const translatable = sentencePool.filter((s) => s.fr);

/** Indice : la première lettre de chaque mot, le reste masqué. */
export function hintFor(sentence: string): string {
  return tokenize(sentence)
    .map((word) => (word.length <= 2 ? word : word[0] + '·'.repeat(word.length - 1)))
    .join(' ');
}

export function TranslationPage() {
  const { level } = useProfile();
  const [seed, setSeed] = useState(() => Date.now());
  const items = useMemo(() => drawSentences(translatable, level, SESSION_SIZE, mulberry32(seed)), [level, seed]);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [scores, setScores] = useState<number[]>([]);

  const item = items[index];
  const ops = useMemo(() => (checked && item ? diffWords(item.it, typed) : []), [checked, item, typed]);

  if (items.length === 0) {
    return (
      <Page title="Traduction" back="/pratique" line="traduction">
        <p>Pas encore de phrases à traduire pour ton niveau.</p>
      </Page>
    );
  }

  const finish = (finalScores: number[]) => {
    const average = finalScores.reduce((a, b) => a + b, 0) / finalScores.length;
    void repo.logAttempt({ kind: 'translation', refId: `traduction-${level}`, score: average });
  };

  if (!item) {
    const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return (
      <Page title="Traduction" back="/pratique" line="traduction">
        <div className="empty">
          <p className="empty__title">Série terminée</p>
          <p>
            Score moyen : <ScoreBadge score={average} />
          </p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              setSeed(Date.now());
              setIndex(0);
              setScores([]);
            }}
          >
            Nouvelle série
          </button>
          <a className="btn btn--block" href="#/">
            Retour à l’accueil
          </a>
        </div>
      </Page>
    );
  }

  const record = (score: number) => {
    setScores([...scores, score]);
  };

  const check = (event: FormEvent) => {
    event.preventDefault();
    if (checked) return;
    setChecked(true);
    // Un indice utilisé plafonne le score à 70.
    const raw = scoreDiff(diffWords(item.it, typed));
    record(hint ? Math.min(raw, 70) : raw);
  };

  /** La traduction de référence n'est pas la seule possible : la personne peut valider la sienne. */
  const acceptMine = () => {
    setScores([...scores.slice(0, -1), 100]);
  };

  const next = () => {
    if (index + 1 === items.length) finish(scores);
    setIndex((i) => i + 1);
    setTyped('');
    setChecked(false);
    setHint(false);
  };

  const current = scores[index];

  return (
    <Page title="Traduction" back="/pratique" line="traduction" aside={<span className="muted">{index + 1} / {items.length}</span>}>
      <form className="dictation" onSubmit={check}>
        <div className="speak-card">
          <p className="muted small">Traduis en italien</p>
          <p className="translate__fr">{item.fr}</p>
          {hint && !checked && (
            <p className="translate__hint it" lang="it" aria-label="Indice">
              {hintFor(item.it)}
            </p>
          )}
        </div>
        <label className="field">
          <span>Ta traduction</span>
          <textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            readOnly={checked}
            rows={3}
            lang="it"
            autoCapitalize="sentences"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        {!checked ? (
          <div className="stack">
            <button type="submit" className="btn btn--primary btn--block" disabled={!typed.trim()}>
              Vérifier
            </button>
            <div className="toolbar">
              <button type="button" className="btn btn--small" onClick={() => setHint(true)} disabled={hint}>
                Indice
              </button>
              <button type="submit" className="btn btn--quiet btn--small">
                Je ne sais pas, voir la réponse
              </button>
            </div>
          </div>
        ) : (
          <div className="feedback">
            <ScoreBadge score={current ?? 0} />
            <WordDiff ops={ops} />
            <div className="flash__answer-row" style={{ justifyContent: 'flex-start' }}>
              <p className="it" lang="it">
                {item.it}
              </p>
              <AudioButton text={item.it} variant="icon" />
            </div>
            {current !== undefined && current < 100 && typed.trim() && (
              <button type="button" className="btn btn--quiet btn--small" onClick={acceptMine}>
                Ma traduction est correcte aussi
              </button>
            )}
            <button type="button" className="btn btn--primary btn--block" onClick={next}>
              {index + 1 < items.length ? 'Phrase suivante' : 'Voir le résultat'}
            </button>
          </div>
        )}
      </form>
      <p className="muted small">
        La correction compare ta phrase à une traduction de référence. Il existe souvent d’autres traductions justes : si c’est le cas, valide la tienne.
      </p>
    </Page>
  );
}
