import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Exercise, LessonBlock } from '../../core/content/types.ts';
import { checkAnswer } from '../../core/text/compare.ts';
import type { AnswerCheck } from '../../core/text/compare.ts';
import { findLesson } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';
import { AudioButton } from '../../ui/AudioButton.tsx';
import { Choices } from '../../ui/Choices.tsx';
import { Page } from '../../ui/Page.tsx';

type Result = 'correct' | 'accent' | 'wrong';

export function LessonPage({ id }: { id: string }) {
  const lesson = findLesson(id);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [logged, setLogged] = useState(false);

  if (!lesson) {
    return (
      <Page title="Leçon introuvable" back="/grammaire" line="grammaire">
        <p>Cette leçon n’existe pas ou a été renommée.</p>
      </Page>
    );
  }

  const answered = Object.keys(results).length;
  const total = lesson.exercises.length;
  const points = Object.values(results).reduce((sum, r) => sum + (r === 'correct' ? 1 : r === 'accent' ? 0.5 : 0), 0);
  const score = total ? Math.round((100 * points) / total) : 0;

  const record = (exerciseId: string, result: Result) => {
    if (results[exerciseId]) return;
    const next = { ...results, [exerciseId]: result };
    setResults(next);
    if (Object.keys(next).length === total && !logged) {
      const finalPoints = Object.values(next).reduce((s, r) => s + (r === 'correct' ? 1 : r === 'accent' ? 0.5 : 0), 0);
      setLogged(true);
      void repo.logAttempt({ kind: 'grammar', refId: lesson.id, score: (100 * finalPoints) / total });
    }
  };

  return (
    <Page title={lesson.title} back="/grammaire" line="grammaire" aside={<span className="chip">{lesson.level}</span>} intro={<p>{lesson.summary}</p>}>
      <div className="lesson">
        {lesson.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      <section className="section" aria-labelledby="exercises">
        <h2 id="exercises">Exercices</h2>
        <ol className="exercises">
          {lesson.exercises.map((exercise) => (
            <li key={exercise.id}>
              <ExerciseView exercise={exercise} onResult={(r) => record(exercise.id, r)} />
            </li>
          ))}
        </ol>
        {answered === total && (
          <div className="summary" role="status">
            <p>
              Score : <strong>{score} %</strong> ({answered} exercices).
            </p>
            <a className="btn btn--primary btn--block" href="#/grammaire">
              Terminer la leçon
            </a>
          </div>
        )}
      </section>
    </Page>
  );
}

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'p':
      return <p>{block.text}</p>;
    case 'rule':
      return <p className="callout callout--rule">{block.text}</p>;
    case 'tip':
      return <p className="callout callout--tip">{block.text}</p>;
    case 'table':
      return (
        <div className="table-wrap">
          <table>
            {block.caption && <caption>{block.caption}</caption>}
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} lang={c === 0 ? undefined : 'it'}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'examples':
      return (
        <ul className="examples">
          {block.items.map((item) => (
            <li key={item.it}>
              <div>
                <p className="it" lang="it">
                  {item.it}
                </p>
                <p className="muted">{item.fr}</p>
              </div>
              <AudioButton text={item.it} variant="icon" />
            </li>
          ))}
        </ul>
      );
  }
}

function ExerciseView({ exercise, onResult }: { exercise: Exercise; onResult: (result: Result) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [check, setCheck] = useState<AnswerCheck | null>(null);

  if (exercise.type === 'choice') {
    const choose = (index: number) => {
      setSelected(index);
      onResult(index === exercise.answer ? 'correct' : 'wrong');
    };
    return (
      <div className="exercise">
        <p className="exercise__prompt">{exercise.prompt}</p>
        {exercise.text && (
          <p className="exercise__text it" lang="it">
            {exercise.text}
          </p>
        )}
        <Choices options={exercise.options} selected={selected} answer={exercise.answer} onSelect={choose} lang="it" />
        {selected !== null && exercise.explanation && <p className="explanation">{exercise.explanation}</p>}
      </div>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (check || !typed.trim()) return;
    const result = checkAnswer(typed, exercise.answers);
    setCheck(result);
    onResult(result);
  };
  const [before, after] = exercise.text.split('___');

  return (
    <form className="exercise" onSubmit={submit}>
      <p className="exercise__prompt">{exercise.prompt}</p>
      <p className="exercise__text it" lang="it">
        {before}
        <input
          className={`cloze${check ? ` is-${check}` : ''}`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          readOnly={check !== null}
          aria-label="Ta réponse"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          lang="it"
          size={Math.max(4, exercise.answers[0].length + 1)}
        />
        {after}
      </p>
      {check === null ? (
        <button type="submit" className="btn">
          Vérifier
        </button>
      ) : (
        <p className="explanation">
          {check === 'correct' && 'Exact. '}
          {check === 'accent' && `Presque : attention à l’accent, on écrit « ${exercise.answers[0]} ». `}
          {check === 'wrong' && `La réponse attendue : « ${exercise.answers.join(' » ou « ')} ». `}
          {exercise.explanation}
        </p>
      )}
    </form>
  );
}
