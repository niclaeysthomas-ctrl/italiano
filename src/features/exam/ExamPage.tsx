import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { recorderSupported, startRecording } from '../../audio/recorder.ts';
import type { Recording } from '../../audio/recorder.ts';
import { speak, stopSpeaking } from '../../audio/tts.ts';
import type { ChoiceQuestion, ExamPaper, ProductionTask } from '../../core/content/types.ts';
import { LEVEL_NAMES } from '../../core/cefr.ts';
import { PASS_MARK, SECTIONS, SECTION_IT, SECTION_NAMES, choiceScore, countWords, criteriaScore, examOutcome, formatClock } from '../../core/exam/scoring.ts';
import type { ExamOutcome, Section } from '../../core/exam/scoring.ts';
import { exams, findExam } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';
import type { ExamResult } from '../../data/repo.ts';
import { useSettings } from '../../app/context.ts';
import { useLive } from '../../lib/live.ts';
import { navigate } from '../../lib/router.tsx';
import { Icon } from '../../ui/Icon.tsx';
import { Page } from '../../ui/Page.tsx';

/** Nombre d'écoutes autorisées par enregistrement, comme à l'examen. */
const MAX_PLAYS = 2;

// ---------- Liste des sujets ----------

export function ExamListPage() {
  const results = useLive(() => repo.getExamResults());
  const best = (id: string) => (results ?? []).filter((r) => r.examId === id).sort((a, b) => b.total - a.total)[0];

  return (
    <Page
      title="Examen blanc"
      back="/pratique"
      line="neutre"
      intro={
        <p>
          Cinq épreuves sur le modèle des certifications CILS : écoute, lecture, grammaire, écrit et oral. Les trois premières sont corrigées
          automatiquement ; tu évalues toi-même l’écrit et l’oral avec une grille et un modèle.
        </p>
      }
    >
      <ul className="rows">
        {exams.map((exam) => {
          const r = best(exam.id);
          return (
            <li key={exam.id}>
              <a className="row" href={`#/examens/${exam.id}`}>
                <span className="chip">{exam.level}</span>
                <span className="row__body">
                  <span className="row__title">
                    {LEVEL_NAMES[exam.level]}, {exam.title.toLowerCase()}
                  </span>
                  <span className="row__meta">
                    {r ? `Meilleur résultat : ${r.total} %${r.passed ? ', réussi' : ''}` : `Environ ${totalMinutes(exam)} minutes`}
                  </span>
                </span>
                <span className="row__end">{r?.passed ? <Icon name="check" label="Réussi" /> : <Icon name="chevron" size={18} />}</span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="muted small about">
        Le format et les durées s’inspirent des épreuves officielles, en version raccourcie. Le seuil de 60 % par épreuve est un repère de
        l’application : chaque certification (CILS, CELI, PLIDA) publie son propre barème.
      </p>
    </Page>
  );
}

function totalMinutes(exam: ExamPaper): number {
  return exam.listening.minutes + exam.reading.minutes + exam.structures.minutes + exam.writing.minutes + exam.speaking.tasks.length * 3;
}

// ---------- Déroulé d'un sujet ----------

type Stage = 'intro' | Section | 'results';

interface ExamState {
  listening: (number | null)[];
  reading: (number | null)[];
  structures: (number | null)[];
  writing: string[];
  writingChecks: boolean[][];
  speakingChecks: boolean[][];
}

const flatKeys = (groups: { questions: ChoiceQuestion[] }[]) => groups.flatMap((g) => g.questions.map((q) => q.answer));

export function ExamPage({ id }: { id: string }) {
  const exam = findExam(id);
  const [stage, setStage] = useState<Stage>('intro');
  const [timed, setTimed] = useState(true);
  const [outcome, setOutcome] = useState<ExamOutcome | null>(null);
  const [state, setState] = useState<ExamState | null>(() =>
    exam
      ? {
          listening: flatKeys(exam.listening.parts).map(() => null),
          reading: flatKeys(exam.reading.texts).map(() => null),
          structures: exam.structures.items.map(() => null),
          writing: exam.writing.tasks.map(() => ''),
          writingChecks: exam.writing.tasks.map((t) => t.criteria.map(() => false)),
          speakingChecks: exam.speaking.tasks.map((t) => t.criteria.map(() => false)),
        }
      : null,
  );

  if (!exam || !state) {
    return (
      <Page title="Sujet introuvable" back="/examens">
        <p>Ce sujet n’existe pas.</p>
      </Page>
    );
  }

  const update = (patch: Partial<ExamState>) => setState((s) => (s ? { ...s, ...patch } : s));

  const next = () => {
    const order: Stage[] = ['intro', ...SECTIONS, 'results'];
    const following = order[order.indexOf(stage) + 1];
    if (following === 'results') finish();
    setStage(following);
    window.scrollTo(0, 0);
  };

  const finish = () => {
    const result = examOutcome({
      listening: choiceScore(state.listening, flatKeys(exam.listening.parts)),
      reading: choiceScore(state.reading, flatKeys(exam.reading.texts)),
      structures: choiceScore(state.structures, exam.structures.items.map((i) => i.answer)),
      writing: criteriaScore(state.writingChecks),
      speaking: criteriaScore(state.speakingChecks),
    });
    setOutcome(result);
    const record: ExamResult = { examId: exam.id, level: exam.level, at: Date.now(), scores: result.scores, total: result.total, passed: result.passed };
    void repo.saveExamResult(record);
    void repo.logAttempt({ kind: 'exam', refId: exam.id, score: result.total });
  };

  const header = (section: Section, minutes?: number) => ({
    title: SECTION_NAMES[section],
    aside: timed && minutes ? <Timer key={section} seconds={minutes * 60} /> : <span className="muted small">{SECTIONS.indexOf(section) + 1} / 5</span>,
  });

  switch (stage) {
    case 'intro':
      return (
        <Page title={`Examen blanc ${exam.level}`} back="/examens" intro={<p>{exam.title}. Environ {totalMinutes(exam)} minutes en tout.</p>}>
          <ol className="exam-plan">
            {SECTIONS.map((s) => (
              <li key={s}>
                <span className="exam-plan__name">{SECTION_NAMES[s]}</span>
                <span className="muted small" lang="it">
                  {SECTION_IT[s]}
                </span>
                <span className="exam-plan__time">{s === 'speaking' ? `${exam.speaking.tasks.length} tâches` : `${exam[s].minutes} min`}</span>
              </li>
            ))}
          </ol>
          <label className="toggle">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
            <span>Chronométrer chaque épreuve</span>
          </label>
          <p className="muted small">
            À l’écoute, chaque enregistrement ne peut être entendu que {MAX_PLAYS} fois. Les réponses ne sont corrigées qu’à la fin. Prévois un endroit
            calme pour l’oral.
          </p>
          <button type="button" className="btn btn--primary btn--block" onClick={next}>
            Commencer l’examen
          </button>
        </Page>
      );

    case 'listening': {
      let offset = 0;
      return (
        <ExamShell {...header('listening', exam.listening.minutes)} onNext={next}>
          {(locked) =>
            exam.listening.parts.map((part, p) => {
              const start = offset;
              offset += part.questions.length;
              return (
                <section key={p} className="exam-part">
                  <h2>Enregistrement {p + 1}</h2>
                  <LimitedAudio text={part.audio} />
                  <QuestionList
                    questions={part.questions}
                    answers={state.listening.slice(start, start + part.questions.length)}
                    locked={locked}
                    onAnswer={(i, value) => update({ listening: state.listening.map((a, k) => (k === start + i ? value : a)) })}
                  />
                </section>
              );
            })
          }
        </ExamShell>
      );
    }

    case 'reading': {
      let offset = 0;
      return (
        <ExamShell {...header('reading', exam.reading.minutes)} onNext={next}>
          {(locked) =>
            exam.reading.texts.map((text, t) => {
              const start = offset;
              offset += text.questions.length;
              return (
                <section key={t} className="exam-part">
                  <h2 lang="it">{text.title}</h2>
                  <div className="exam-text it" lang="it">
                    {text.text.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  <QuestionList
                    questions={text.questions}
                    answers={state.reading.slice(start, start + text.questions.length)}
                    locked={locked}
                    onAnswer={(i, value) => update({ reading: state.reading.map((a, k) => (k === start + i ? value : a)) })}
                  />
                </section>
              );
            })
          }
        </ExamShell>
      );
    }

    case 'structures':
      return (
        <ExamShell {...header('structures', exam.structures.minutes)} onNext={next}>
          {(locked) => (
            <QuestionList
              questions={exam.structures.items.map((item) => ({ q: item.text, options: item.options, answer: item.answer }))}
              answers={state.structures}
              locked={locked}
              numbered
              onAnswer={(i, value) => update({ structures: state.structures.map((a, k) => (k === i ? value : a)) })}
            />
          )}
        </ExamShell>
      );

    case 'writing':
      return (
        <WritingSection
          exam={exam}
          header={header('writing', exam.writing.minutes)}
          texts={state.writing}
          checks={state.writingChecks}
          onText={(i, value) => update({ writing: state.writing.map((t, k) => (k === i ? value : t)) })}
          onChecks={(checks) => update({ writingChecks: checks })}
          onNext={next}
        />
      );

    case 'speaking':
      return <SpeakingSection exam={exam} checks={state.speakingChecks} onChecks={(checks) => update({ speakingChecks: checks })} onNext={next} />;

    case 'results':
      return outcome ? <Results exam={exam} outcome={outcome} state={state} /> : null;
  }
}

// ---------- Briques ----------

function ExamShell({ title, aside, onNext, children }: { title: string; aside: ReactNode; onNext: () => void; children: (locked: boolean) => ReactNode }) {
  const [expired, setExpired] = useState(false);
  return (
    <TimerContext onExpire={() => setExpired(true)}>
      <Page title={title} aside={aside}>
        {expired && (
          <p className="callout callout--tip" role="alert">
            Temps écoulé : tes réponses sont enregistrées telles quelles.
          </p>
        )}
        <fieldset className="exam-fieldset" disabled={expired}>
          {children(expired)}
        </fieldset>
        <button type="button" className="btn btn--primary btn--block exam-next" onClick={onNext}>
          Terminer l’épreuve
        </button>
      </Page>
    </TimerContext>
  );
}

let expireListener: (() => void) | null = null;

/** Relie le minuteur affiché dans l'en-tête à l'épreuve en cours. */
function TimerContext({ onExpire, children }: { onExpire: () => void; children: ReactNode }) {
  useEffect(() => {
    expireListener = onExpire;
    return () => {
      expireListener = null;
    };
  }, [onExpire]);
  return <>{children}</>;
}

function Timer({ seconds }: { seconds: number }) {
  const end = useRef(Date.now() + seconds * 1000);
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const tick = window.setInterval(() => {
      const remaining = (end.current - Date.now()) / 1000;
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(tick);
        expireListener?.();
      }
    }, 500);
    return () => window.clearInterval(tick);
  }, []);
  return (
    <span className={`timer${left < 60 ? ' is-low' : ''}`} role="timer" aria-label={`Temps restant : ${formatClock(left)}`}>
      {formatClock(left)}
    </span>
  );
}

function LimitedAudio({ text }: { text: string }) {
  const settings = useSettings();
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  const left = MAX_PLAYS - plays;
  const play = async () => {
    if (left <= 0 || playing) return;
    setPlays((n) => n + 1);
    setPlaying(true);
    try {
      await speak(text, { rate: settings.rate, voiceURI: settings.voiceURI });
    } finally {
      setPlaying(false);
    }
  };
  return (
    <div className="toolbar">
      <button type="button" className={`audio audio--large${playing ? ' is-playing' : ''}`} onClick={play} disabled={left <= 0 && !playing}>
        <Icon name="speaker" />
        <span>{playing ? 'Écoute en cours…' : left > 0 ? 'Écouter' : 'Écoutes épuisées'}</span>
      </button>
      <span className="muted small">
        {left} écoute{left > 1 ? 's' : ''} restante{left > 1 ? 's' : ''}
      </span>
    </div>
  );
}

function QuestionList({
  questions,
  answers,
  locked,
  numbered,
  onAnswer,
}: {
  questions: ChoiceQuestion[];
  answers: (number | null)[];
  locked: boolean;
  numbered?: boolean;
  onAnswer: (index: number, value: number) => void;
}) {
  return (
    <ol className={`exam-questions${numbered ? '' : ' is-plain'}`}>
      {questions.map((q, i) => (
        <li key={i} className="exercise">
          <p className="exercise__prompt it" lang="it">
            {q.q}
          </p>
          <ExamChoices options={q.options} selected={answers[i]} disabled={locked} onSelect={(v) => onAnswer(i, v)} />
        </li>
      ))}
    </ol>
  );
}

/** Choix sans correction immédiate (on peut changer d'avis jusqu'à la fin de l'épreuve). */
function ExamChoices({ options, selected, disabled, onSelect }: { options: string[]; selected: number | null; disabled: boolean; onSelect: (i: number) => void }) {
  const inline = options.length === 2;
  return (
    <div className={`choices${inline ? ' choices--inline' : ''}`} role="radiogroup">
      {options.map((option, i) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={selected === i}
          className={`choice${selected === i ? ' is-selected' : ''}`}
          onClick={() => onSelect(i)}
          disabled={disabled}
          lang="it"
        >
          <span>{option}</span>
          {selected === i && <Icon name="check" size={18} />}
        </button>
      ))}
    </div>
  );
}

function CriteriaChecklist({ criteria, checked, onChange }: { criteria: string[]; checked: boolean[]; onChange: (next: boolean[]) => void }) {
  return (
    <fieldset className="criteria-list">
      <legend>Évalue-toi honnêtement</legend>
      {criteria.map((c, i) => (
        <label key={c} className={checked[i] ? 'is-on' : undefined}>
          <input type="checkbox" checked={checked[i]} onChange={(e) => onChange(checked.map((v, k) => (k === i ? e.target.checked : v)))} />
          <span>{c}</span>
        </label>
      ))}
    </fieldset>
  );
}

function TaskPrompt({ task }: { task: ProductionTask }) {
  return (
    <div className="speak-card">
      <p className="it exam-prompt" lang="it">
        {task.prompt}
      </p>
      <p className="muted small">{task.promptFr}</p>
    </div>
  );
}

function WritingSection({
  exam,
  header,
  texts,
  checks,
  onText,
  onChecks,
  onNext,
}: {
  exam: ExamPaper;
  header: { title: string; aside: ReactNode };
  texts: string[];
  checks: boolean[][];
  onText: (i: number, value: string) => void;
  onChecks: (checks: boolean[][]) => void;
  onNext: () => void;
}) {
  const [review, setReview] = useState(false);
  const [expired, setExpired] = useState(false);

  if (review) {
    return (
      <Page title="Expression écrite : correction" aside={<span className="muted small">4 / 5</span>}>
        {exam.writing.tasks.map((task, i) => (
          <section key={i} className="exam-part">
            <h2>Ton texte</h2>
            <p className="exam-answer it" lang="it">
              {texts[i].trim() || '(aucun texte)'}
            </p>
            <p className="muted small">{countWords(texts[i])} mots</p>
            <h2>Un modèle possible</h2>
            <p className="exam-model it" lang="it">
              {task.model}
            </p>
            <CriteriaChecklist criteria={task.criteria} checked={checks[i]} onChange={(next) => onChecks(checks.map((c, k) => (k === i ? next : c)))} />
          </section>
        ))}
        <button type="button" className="btn btn--primary btn--block" onClick={onNext}>
          Passer à l’oral
        </button>
      </Page>
    );
  }

  return (
    <TimerContext onExpire={() => setExpired(true)}>
      <Page title={header.title} aside={header.aside}>
        {expired && (
          <p className="callout callout--tip" role="alert">
            Temps écoulé. Tu peux maintenant comparer ton texte au modèle.
          </p>
        )}
        {exam.writing.tasks.map((task, i) => {
          const words = countWords(texts[i]);
          const min = task.minWords ?? 0;
          const max = task.maxWords ?? Infinity;
          return (
            <section key={i} className="exam-part">
              <TaskPrompt task={task} />
              <label className="field">
                <span>
                  Ton texte ({min} à {max} mots)
                </span>
                <textarea value={texts[i]} onChange={(e) => onText(i, e.target.value)} readOnly={expired} rows={8} lang="it" spellCheck={false} autoCapitalize="sentences" />
              </label>
              <p className={`small ${words < min || words > max ? 'word-count is-off' : 'word-count'}`}>{words} mots</p>
            </section>
          );
        })}
        <button type="button" className="btn btn--primary btn--block" onClick={() => setReview(true)}>
          Terminer et me corriger
        </button>
      </Page>
    </TimerContext>
  );
}

function SpeakingSection({ exam, checks, onChecks, onNext }: { exam: ExamPaper; checks: boolean[][]; onChecks: (c: boolean[][]) => void; onNext: () => void }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'prep' | 'speak' | 'review'>('prep');
  const [recording, setRecording] = useState<Recording | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const task = exam.speaking.tasks[index];
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const startSpeaking = async () => {
    setPhase('speak');
    setError(null);
    if (!recorderSupported) return;
    try {
      setRecording(await startRecording());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Micro indisponible : parle quand même à voix haute.');
    }
  };

  const stopSpeaking = async () => {
    if (recording) {
      const blob = await recording.stop();
      const url = URL.createObjectURL(blob);
      urls.current.push(url);
      setAudioUrl(url);
      setRecording(null);
    }
    setPhase('review');
  };

  const nextTask = () => {
    if (index + 1 < exam.speaking.tasks.length) {
      setIndex(index + 1);
      setPhase('prep');
      setAudioUrl(null);
      window.scrollTo(0, 0);
    } else onNext();
  };

  return (
    <Page title="Expression orale" aside={<span className="muted small">Tâche {index + 1} / {exam.speaking.tasks.length}</span>}>
      <TaskPrompt task={task} />
      {phase === 'prep' && (
        <div className="stack">
          <p>
            Prépare-toi pendant <Prep key={index} seconds={task.prepSeconds ?? 60} onDone={startSpeaking} />, puis parle à voix haute.
          </p>
          <button type="button" className="btn btn--primary btn--block" onClick={startSpeaking}>
            <Icon name="mic" /> Je suis prêt, je parle
          </button>
        </div>
      )}
      {phase === 'speak' && (
        <div className="stack">
          <p className="callout callout--rule">{recording ? 'Enregistrement en cours. Parle maintenant.' : 'Parle maintenant à voix haute.'}</p>
          {error && <p className="error">{error}</p>}
          <button type="button" className="btn btn--primary btn--block is-live" onClick={stopSpeaking}>
            <Icon name="stop" size={18} /> J’ai terminé
          </button>
        </div>
      )}
      {phase === 'review' && (
        <section className="exam-part">
          {audioUrl && (
            <>
              <h2>Ton enregistrement</h2>
              <audio controls src={audioUrl} />
            </>
          )}
          <h2>Un modèle possible</h2>
          <p className="exam-model it" lang="it">
            {task.model}
          </p>
          <CriteriaChecklist criteria={task.criteria} checked={checks[index]} onChange={(next) => onChecks(checks.map((c, k) => (k === index ? next : c)))} />
          <button type="button" className="btn btn--primary btn--block" onClick={nextTask}>
            {index + 1 < exam.speaking.tasks.length ? 'Tâche suivante' : 'Voir mes résultats'}
          </button>
        </section>
      )}
    </Page>
  );
}

function Prep({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const end = Date.now() + seconds * 1000;
    const tick = window.setInterval(() => {
      const remaining = (end - Date.now()) / 1000;
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(tick);
        done.current();
      }
    }, 500);
    return () => window.clearInterval(tick);
  }, [seconds]);
  return <strong className="timer">{formatClock(left)}</strong>;
}

function Results({ exam, outcome, state }: { exam: ExamPaper; outcome: ExamOutcome; state: ExamState }) {
  const reviews = useMemo(
    () => [
      { section: 'listening' as const, questions: exam.listening.parts.flatMap((p) => p.questions), answers: state.listening },
      { section: 'reading' as const, questions: exam.reading.texts.flatMap((t) => t.questions), answers: state.reading },
      {
        section: 'structures' as const,
        questions: exam.structures.items.map((i) => ({ q: i.text, options: i.options, answer: i.answer })),
        answers: state.structures,
      },
    ],
    [exam, state],
  );

  return (
    <Page title="Résultats" back="/examens">
      <div className={`exam-verdict${outcome.passed ? ' is-pass' : ''}`}>
        <p className="exam-verdict__score">{outcome.total} %</p>
        <p>
          {outcome.passed
            ? `Toutes les épreuves dépassent ${PASS_MARK} % : niveau ${exam.level} validé sur ce sujet.`
            : `À retravailler : ${outcome.weak.map((s) => SECTION_NAMES[s].toLowerCase()).join(', ')}.`}
        </p>
      </div>

      <table className="scores">
        <caption>Par épreuve (seuil {PASS_MARK} %)</caption>
        <tbody>
          {SECTIONS.map((s) => (
            <tr key={s}>
              <th scope="row">{SECTION_NAMES[s]}</th>
              <td className={outcome.scores[s] >= PASS_MARK ? 'is-ok' : 'is-ko'}>{outcome.scores[s]} %</td>
            </tr>
          ))}
        </tbody>
      </table>

      {reviews.map(({ section, questions, answers }) => {
        const wrong = questions.map((q, i) => ({ q, given: answers[i] })).filter(({ q, given }) => given !== q.answer);
        return (
          <details key={section} className="exam-review">
            <summary>
              {SECTION_NAMES[section]} : {wrong.length === 0 ? 'aucune erreur' : `${wrong.length} erreur${wrong.length > 1 ? 's' : ''}`}
            </summary>
            {wrong.map(({ q, given }, i) => (
              <div key={i} className="exam-review__item">
                <p className="it" lang="it">
                  {q.q}
                </p>
                <p className="small">
                  {given === null ? <span className="muted">Sans réponse</span> : <del lang="it">{q.options[given]}</del>} →{' '}
                  <strong lang="it">{q.options[q.answer]}</strong>
                </p>
              </div>
            ))}
          </details>
        );
      })}

      <div className="stack exam-actions">
        <button type="button" className="btn btn--primary btn--block" onClick={() => navigate('/examens')}>
          Retour aux sujets
        </button>
      </div>
    </Page>
  );
}
