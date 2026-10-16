import { useMemo, useState } from 'react';
import { LEVELS, LEVEL_NAMES } from '../../core/cefr.ts';
import type { Level } from '../../core/cefr.ts';
import { answerPlacement, currentQuestionId, startPlacement } from '../../core/placement/engine.ts';
import type { PlacementState } from '../../core/placement/engine.ts';
import { mulberry32 } from '../../core/random.ts';
import { placementQuestions } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';
import { navigate } from '../../lib/router.tsx';
import { useOptionalProfile } from '../../app/context.ts';
import { AudioButton } from '../../ui/AudioButton.tsx';
import { Choices } from '../../ui/Choices.tsx';
import { LevelLine } from '../../ui/LevelLine.tsx';
import { Page } from '../../ui/Page.tsx';

export function PlacementPage() {
  const profile = useOptionalProfile();
  const rng = useMemo(() => mulberry32(Date.now()), []);
  const [state, setState] = useState<PlacementState | null>(null);
  const back = profile ? '/profil' : '/';

  if (!state) {
    return (
      <Page title="Test de niveau" back={back}>
        <div className="prose">
          <p>Le test s’adapte à tes réponses : il monte quand tu réussis, redescend quand c’est trop difficile. Compte de 4 à 16 questions, quatre par niveau testé.</p>
          <p>Certaines questions sont à écouter. Si tu ne sais pas, dis-le plutôt que de deviner : le résultat sera plus juste.</p>
        </div>
        <button type="button" className="btn btn--primary btn--block" onClick={() => setState(startPlacement(placementQuestions, rng))}>
          Commencer le test
        </button>
      </Page>
    );
  }

  if (state.done && state.recommended) {
    return <PlacementResult state={state} recommended={state.recommended} />;
  }

  const id = currentQuestionId(state);
  const question = placementQuestions.find((q) => q.id === id);
  if (!question) return null;
  const answer = (correct: boolean) => setState(answerPlacement(state, placementQuestions, correct, rng));

  return (
    <Page title={`Question ${state.history.length + 1}`} back={back}>
      <section className="question" key={question.id}>
        <p className="question__prompt">{question.prompt}</p>
        {question.audio && (
          <div className="question__audio">
            <AudioButton text={question.audio} variant="large" />
            <AudioButton text={question.audio} label="Plus lentement" speed={0.75} />
          </div>
        )}
        {question.text && (
          <p className="question__text it" lang="it">
            {question.text}
          </p>
        )}
        <Choices options={question.options} selected={null} onSelect={(i) => answer(i === question.answer)} />
        <button type="button" className="btn btn--quiet btn--block" onClick={() => answer(false)}>
          Je ne sais pas
        </button>
      </section>
    </Page>
  );
}

function PlacementResult({ state, recommended }: { state: PlacementState; recommended: Level }) {
  const profile = useOptionalProfile();
  const [chosen, setChosen] = useState<Level>(recommended);

  const save = async () => {
    await repo.saveProfile({
      level: chosen,
      createdAt: profile?.createdAt ?? Date.now(),
      placement: { recommended, scores: state.scores, at: Date.now() },
    });
    navigate('/', { replace: true });
  };

  return (
    <Page title="Ton niveau">
      <p className="result__headline">
        On te conseille de travailler le niveau <strong>{recommended}</strong>, {LEVEL_NAMES[recommended].toLowerCase()}.
      </p>
      <LevelLine current={chosen} />
      <table className="scores">
        <caption>Tes réponses par niveau</caption>
        <tbody>
          {LEVELS.filter((level) => state.scores[level]).map((level) => {
            const score = state.scores[level]!;
            return (
              <tr key={level}>
                <th scope="row">{level}</th>
                <td>
                  {score.correct} sur {score.total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <fieldset className="segmented">
        <legend>Niveau de départ</legend>
        {LEVELS.map((level) => (
          <label key={level} className={chosen === level ? 'is-active' : undefined}>
            <input type="radio" name="level" value={level} checked={chosen === level} onChange={() => setChosen(level)} />
            {level}
          </label>
        ))}
      </fieldset>
      <button type="button" className="btn btn--primary btn--block" onClick={save}>
        Commencer en {chosen}
      </button>
    </Page>
  );
}
