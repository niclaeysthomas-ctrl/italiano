import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { drawSentences } from '../../core/practice/pool.ts';
import { mulberry32 } from '../../core/random.ts';
import { diffWords, scoreDiff } from '../../core/text/compare.ts';
import { repo } from '../../data/repo.ts';
import { useProfile } from '../../app/context.ts';
import { AudioButton } from '../../ui/AudioButton.tsx';
import { Page } from '../../ui/Page.tsx';
import { ScoreBadge, WordDiff } from '../../ui/WordDiff.tsx';
import { sentencePool } from './sentences.ts';

const SESSION_SIZE = 5;

export function DictationPage() {
  const { level } = useProfile();
  const [seed, setSeed] = useState(() => Date.now());
  const sentences = useMemo(() => drawSentences(sentencePool, level, SESSION_SIZE, mulberry32(seed)), [level, seed]);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [scores, setScores] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const sentence = sentences[index];
  const ops = useMemo(() => (checked && sentence ? diffWords(sentence.it, typed) : []), [checked, sentence, typed]);

  if (sentences.length === 0) {
    return (
      <Page title="Dictée" back="/pratique" line="dictee">
        <p>Pas encore de phrases pour ton niveau.</p>
      </Page>
    );
  }

  if (!sentence) {
    const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return (
      <Page title="Dictée" back="/pratique" line="dictee">
        <div className="empty">
          <p className="empty__title">Dictée terminée</p>
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
            Nouvelle dictée
          </button>
          <a className="btn btn--block" href="#/">
            Retour à l’accueil
          </a>
        </div>
      </Page>
    );
  }

  const check = (event: FormEvent) => {
    event.preventDefault();
    if (checked) return;
    const score = scoreDiff(diffWords(sentence.it, typed));
    const nextScores = [...scores, score];
    setScores(nextScores);
    setChecked(true);
    if (nextScores.length === sentences.length) {
      const average = nextScores.reduce((a, b) => a + b, 0) / nextScores.length;
      void repo.logAttempt({ kind: 'dictation', refId: `dictee-${level}`, score: average });
    }
  };

  const next = () => {
    setIndex((i) => i + 1);
    setTyped('');
    setChecked(false);
  };

  return (
    <Page title="Dictée" back="/pratique" line="dictee" aside={<span className="muted">{index + 1} / {sentences.length}</span>}>
      <form className="dictation" onSubmit={check}>
        <div className="toolbar">
          <AudioButton text={sentence.it} variant="large" />
          <AudioButton text={sentence.it} label="Plus lentement" speed={0.7} />
        </div>
        <label className="field">
          <span>Écris ce que tu entends</span>
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
            <button type="submit" className="btn btn--quiet btn--block">
              Je ne sais pas, voir la phrase
            </button>
          </div>
        ) : (
          <div className="feedback">
            <ScoreBadge score={scores[scores.length - 1]} />
            <WordDiff ops={ops} />
            <p className="it" lang="it">
              {sentence.it}
            </p>
            {sentence.fr && <p className="muted">{sentence.fr}</p>}
            <button type="button" className="btn btn--primary btn--block" onClick={next}>
              {index + 1 < sentences.length ? 'Phrase suivante' : 'Voir le résultat'}
            </button>
          </div>
        )}
      </form>
    </Page>
  );
}
