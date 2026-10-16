import { useEffect, useMemo, useRef, useState } from 'react';
import { recorderSupported, startRecording } from '../../audio/recorder.ts';
import type { Recording } from '../../audio/recorder.ts';
import { listen, sttSupported } from '../../audio/stt.ts';
import type { Listening } from '../../audio/stt.ts';
import { drawSentences } from '../../core/practice/pool.ts';
import { mulberry32 } from '../../core/random.ts';
import { diffWords, scoreDiff } from '../../core/text/compare.ts';
import type { DiffOp } from '../../core/text/compare.ts';
import { repo } from '../../data/repo.ts';
import { useProfile } from '../../app/context.ts';
import { AudioButton } from '../../ui/AudioButton.tsx';
import { Icon } from '../../ui/Icon.tsx';
import { Page } from '../../ui/Page.tsx';
import { ScoreBadge, WordDiff } from '../../ui/WordDiff.tsx';
import { sentencePool } from './sentences.ts';

interface Outcome {
  transcript: string;
  ops: DiffOp[];
  score: number;
}

export function SpeakingPage() {
  const { level } = useProfile();
  const [seed, setSeed] = useState(() => Date.now());
  const sentence = useMemo(() => drawSentences(sentencePool, level, 1, mulberry32(seed))[0], [level, seed]);

  const [listening, setListening] = useState<Listening | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [playback, setPlayback] = useState<string | null>(null);
  const playbackRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (playbackRef.current) URL.revokeObjectURL(playbackRef.current);
    },
    [],
  );

  if (!sentence) {
    return (
      <Page title="Prononciation" back="/pratique" line="oral">
        <p>Pas encore de phrases pour ton niveau.</p>
      </Page>
    );
  }

  const speakNow = async () => {
    setError(null);
    setOutcome(null);
    const session = listen('it-IT');
    setListening(session);
    try {
      const result = await session.result;
      // Parmi les transcriptions proposées, on garde la plus proche de la phrase attendue.
      const best = result.alternatives
        .map((transcript) => {
          const ops = diffWords(sentence.it, transcript);
          return { transcript, ops, score: scoreDiff(ops) };
        })
        .sort((a, b) => b.score - a.score)[0];
      if (best) {
        setOutcome(best);
        void repo.logAttempt({ kind: 'speaking', refId: sentence.id, score: best.score });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setListening(null);
    }
  };

  const toggleRecording = async () => {
    setError(null);
    if (recording) {
      const blob = await recording.stop();
      setRecording(null);
      if (playbackRef.current) URL.revokeObjectURL(playbackRef.current);
      const url = URL.createObjectURL(blob);
      playbackRef.current = url;
      setPlayback(url);
      return;
    }
    try {
      setRecording(await startRecording());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible d’accéder au micro.');
    }
  };

  const nextSentence = () => {
    setSeed(Date.now());
    setOutcome(null);
    setError(null);
    setPlayback(null);
  };

  return (
    <Page title="Prononciation" back="/pratique" line="oral" intro={<p>Écoute le modèle, puis dis la phrase à voix haute.</p>}>
      <article className="speak-card">
        <p className="speak-card__it it" lang="it">
          {sentence.it}
        </p>
        {sentence.fr && <p className="muted">{sentence.fr}</p>}
        <div className="toolbar">
          <AudioButton text={sentence.it} label="Écouter le modèle" />
          <AudioButton text={sentence.it} label="Lentement" speed={0.7} />
        </div>
      </article>

      <div className="stack">
        {sttSupported ? (
          <button type="button" className={`btn btn--primary btn--block${listening ? ' is-live' : ''}`} onClick={listening ? () => listening.stop() : speakNow}>
            <Icon name="mic" /> {listening ? 'Je t’écoute… touche pour arrêter' : 'Parler'}
          </button>
        ) : (
          <p className="callout callout--tip">
            La reconnaissance vocale n’est pas disponible dans ce navigateur (essaie Chrome ou Safari). Tu peux quand même t’enregistrer et comparer à
            l’oreille.
          </p>
        )}
        {recorderSupported && (
          <button type="button" className={`btn btn--block${recording ? ' is-live' : ''}`} onClick={toggleRecording}>
            <Icon name={recording ? 'stop' : 'record'} size={18} /> {recording ? 'Arrêter l’enregistrement' : 'M’enregistrer'}
          </button>
        )}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {playback && (
        <div className="section">
          <h2>Ton enregistrement</h2>
          <audio controls src={playback} />
        </div>
      )}

      {outcome && (
        <div className="feedback" role="status">
          <ScoreBadge score={outcome.score} />
          <p className="muted small">Ce que la reconnaissance a compris :</p>
          <p className="it" lang="it">
            « {outcome.transcript} »
          </p>
          <WordDiff ops={outcome.ops} />
        </div>
      )}

      <button type="button" className="btn btn--quiet btn--block" onClick={nextSentence}>
        Autre phrase
      </button>
      <p className="muted small">
        Le score compare les mots reconnus à la phrase attendue : il reflète l’intelligibilité, pas l’accent. Dans Chrome, l’audio est transcrit par les
        serveurs de Google.
      </p>
    </Page>
  );
}
