import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { levelIndex } from '../../core/cefr.ts';
import { PERSONS, TENSES, TENSE_LEVEL, TENSE_NAMES, acceptedForms, conjugate } from '../../core/conjugation/engine.ts';
import type { Tense, Verb } from '../../core/conjugation/engine.ts';
import { VERBS } from '../../core/conjugation/verbs.ts';
import { mulberry32 } from '../../core/random.ts';
import type { Rng } from '../../core/random.ts';
import { checkAnswer, stripAccents } from '../../core/text/compare.ts';
import type { AnswerCheck } from '../../core/text/compare.ts';
import { repo } from '../../data/repo.ts';
import { useProfile } from '../../app/context.ts';
import { AudioButton } from '../../ui/AudioButton.tsx';
import { Icon } from '../../ui/Icon.tsx';
import { Page } from '../../ui/Page.tsx';
import { ScoreBadge } from '../../ui/WordDiff.tsx';

const SERIES = 10;

interface Question {
  verb: Verb;
  tense: Tense;
  person: number;
}

function draw(verbs: readonly Verb[], tenses: readonly Tense[], rng: Rng): Question[] {
  const questions: Question[] = [];
  let guard = 0;
  while (questions.length < SERIES && guard++ < 200) {
    const q = {
      verb: verbs[Math.floor(rng() * verbs.length)],
      tense: tenses[Math.floor(rng() * tenses.length)],
      person: Math.floor(rng() * 6),
    };
    if (!questions.some((x) => x.verb === q.verb && x.tense === q.tense)) questions.push(q);
  }
  return questions;
}

/** La réponse peut être tapée avec ou sans pronom sujet. */
function stripPronoun(answer: string): string {
  return answer.trim().replace(/^(io|tu|lui|lei|noi|voi|loro)\s+/i, '');
}

export function ConjugationPage() {
  const { level } = useProfile();
  const myVerbs = useMemo(() => VERBS.filter((v) => levelIndex(v.level) <= levelIndex(level)), [level]);
  const defaultTenses = TENSES.filter((t) => levelIndex(TENSE_LEVEL[t]) <= levelIndex(level));
  const [tenses, setTenses] = useState<Tense[]>(defaultTenses);
  const [series, setSeries] = useState<Question[] | null>(null);
  const [tab, setTab] = useState<'quiz' | 'tables'>('quiz');

  const toggle = (t: Tense) => setTenses((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  if (series) return <Quiz questions={series} onDone={() => setSeries(null)} />;

  return (
    <Page title="Conjugaison" back="/grammaire" line="grammaire" intro={<p>{myVerbs.length} verbes courants, six temps. Entraîne-toi, ou consulte les tableaux.</p>}>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'quiz'} className={tab === 'quiz' ? 'is-active' : undefined} onClick={() => setTab('quiz')}>
          S’entraîner
        </button>
        <button type="button" role="tab" aria-selected={tab === 'tables'} className={tab === 'tables' ? 'is-active' : undefined} onClick={() => setTab('tables')}>
          Tableaux
        </button>
      </div>

      {tab === 'quiz' ? (
        <section className="stack">
          <fieldset className="chips">
            <legend>Temps à travailler</legend>
            {TENSES.map((t) => (
              <label key={t} className={tenses.includes(t) ? 'is-active' : undefined}>
                <input type="checkbox" checked={tenses.includes(t)} onChange={() => toggle(t)} />
                {TENSE_NAMES[t]}
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={tenses.length === 0}
            onClick={() => setSeries(draw(myVerbs, tenses, mulberry32(Date.now())))}
          >
            Commencer une série de {SERIES}
          </button>
          <p className="muted small">Les verbes proposés vont jusqu’à ton niveau ({level}). Tu peux taper la forme avec ou sans pronom.</p>
        </section>
      ) : (
        <VerbList />
      )}
    </Page>
  );
}

function VerbList() {
  const [query, setQuery] = useState('');
  const q = stripAccents(query.trim().toLowerCase());
  const list = VERBS.filter((v) => !q || v.inf.includes(q) || stripAccents(v.fr.toLowerCase()).includes(q));
  return (
    <>
      <div className="search">
        <label className="search__field">
          <Icon name="search" size={18} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher un verbe" aria-label="Chercher un verbe" autoCapitalize="off" />
        </label>
      </div>
      <ul className="rows">
        {list.map((verb) => (
          <li key={verb.inf}>
            <a className="row" href={`#/conjugaison/${verb.inf}`}>
              <span className="chip">{verb.level}</span>
              <span className="row__body">
                <span className="row__title it" lang="it">
                  {verb.inf}
                </span>
                <span className="row__meta">{verb.fr}</span>
              </span>
              <span className="row__end">
                <Icon name="chevron" size={18} />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function Quiz({ questions, onDone }: { questions: Question[]; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<AnswerCheck | null>(null);
  const [points, setPoints] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const q = questions[index];

  if (!q) {
    const score = Math.round((100 * points) / questions.length);
    return (
      <Page title="Conjugaison" back="/grammaire" line="grammaire">
        <div className="empty">
          <p className="empty__title">Série terminée</p>
          <p>
            Score : <ScoreBadge score={score} />
          </p>
          <button type="button" className="btn btn--primary btn--block" onClick={onDone}>
            Nouvelle série
          </button>
        </div>
      </Page>
    );
  }

  const accepted = acceptedForms(q.verb, q.tense, q.person);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (result) return;
    const check = checkAnswer(stripPronoun(typed), accepted);
    setResult(check);
    const gained = check === 'correct' ? 1 : check === 'accent' ? 0.5 : 0;
    setPoints((p) => p + gained);
    if (index + 1 === questions.length) {
      void repo.logAttempt({ kind: 'conjugation', refId: 'serie', score: (100 * (points + gained)) / questions.length });
    }
  };
  const next = () => {
    setIndex((i) => i + 1);
    setTyped('');
    setResult(null);
    window.setTimeout(() => input.current?.focus(), 0);
  };

  const pronoun = PERSONS[q.person];
  const all = conjugate(q.verb, q.tense);

  return (
    <Page title="Conjugaison" back="/grammaire" line="grammaire" aside={<span className="muted">{index + 1} / {questions.length}</span>}>
      <form className="dictation" onSubmit={submit}>
        <div className="speak-card">
          <p className="muted small">{TENSE_NAMES[q.tense]}</p>
          <p className="conj__prompt">
            <span className="it" lang="it">
              {q.verb.inf}
            </span>{' '}
            <span className="muted">({q.verb.fr})</span>
          </p>
          <p className="conj__person it" lang="it">
            {pronoun} …
          </p>
        </div>
        <label className="field">
          <span>Ta réponse</span>
          <input
            ref={input}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            readOnly={result !== null}
            lang="it"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            className={`conj__input${result ? ` is-${result}` : ''}`}
          />
        </label>
        {result === null ? (
          <div className="stack">
            <button type="submit" className="btn btn--primary btn--block" disabled={!typed.trim()}>
              Vérifier
            </button>
            <button type="submit" className="btn btn--quiet btn--block">
              Je ne sais pas
            </button>
          </div>
        ) : (
          <div className="feedback">
            <p>
              {result === 'correct' && 'Exact.'}
              {result === 'accent' && 'Presque : attention à l’accent.'}
              {result === 'wrong' && 'La bonne réponse :'}{' '}
              <strong className="it" lang="it">
                {pronoun} {accepted[0]}
              </strong>
              {accepted.length > 1 && <span className="muted small"> (au féminin : {accepted[1]})</span>}
            </p>
            <ConjTable forms={all} highlight={q.person} />
            <AudioButton text={PERSONS.map((p, i) => `${p.split(',')[0]} ${all[i]}`).join(', ')} label="Écouter la conjugaison" />
            <button type="button" className="btn btn--primary btn--block" onClick={next}>
              {index + 1 < questions.length ? 'Suivant' : 'Voir le résultat'}
            </button>
          </div>
        )}
      </form>
    </Page>
  );
}

export function ConjTable({ forms, highlight }: { forms: readonly string[]; highlight?: number }) {
  return (
    <table className="conj-table">
      <tbody>
        {PERSONS.map((p, i) => (
          <tr key={p} className={i === highlight ? 'is-highlight' : undefined}>
            <th scope="row">{p}</th>
            <td lang="it">{forms[i]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function VerbPage({ inf }: { inf: string }) {
  const verb = VERBS.find((v) => v.inf === inf);
  if (!verb) {
    return (
      <Page title="Verbe introuvable" back="/conjugaison" line="grammaire">
        <p>Ce verbe n’est pas encore dans la liste.</p>
      </Page>
    );
  }
  return (
    <Page
      title={verb.inf}
      back="/conjugaison"
      line="grammaire"
      aside={<span className="chip">{verb.level}</span>}
      intro={
        <p>
          {verb.fr}. Auxiliaire : <span lang="it">{verb.aux}</span>.{verb.isc && ' Prend -isc- au présent.'}
        </p>
      }
    >
      <div className="conj-grid">
        {TENSES.map((tense) => {
          const forms = conjugate(verb, tense);
          return (
            <section key={tense} className="conj-card">
              <div className="conj-card__head">
                <h2>{TENSE_NAMES[tense]}</h2>
                <AudioButton text={PERSONS.map((p, i) => `${p.split(',')[0]} ${forms[i]}`).join(', ')} variant="icon" label={`Écouter : ${TENSE_NAMES[tense]}`} />
              </div>
              <ConjTable forms={forms} />
            </section>
          );
        })}
      </div>
      {verb.aux === 'essere' && <p className="muted small">Avec essere, le participe s’accorde : sono andata, siamo andate.</p>}
    </Page>
  );
}
