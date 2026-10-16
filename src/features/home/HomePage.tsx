import type { ReactNode } from 'react';
import { LEVEL_NAMES } from '../../core/cefr.ts';
import { computeStreak, studyDay } from '../../core/dates.ts';
import { pickDaily } from '../../core/daily/pick.ts';
import { lessons, readings } from '../../content/index.ts';
import { repo } from '../../data/repo.ts';
import type { Attempt } from '../../data/repo.ts';
import { useProfile } from '../../app/context.ts';
import { useLive } from '../../lib/live.ts';
import { Icon } from '../../ui/Icon.tsx';
import type { IconName } from '../../ui/Icon.tsx';
import { LevelLine } from '../../ui/LevelLine.tsx';
import type { Line } from '../../ui/Page.tsx';
import { loadStudySnapshot } from '../cards/studyData.ts';

export function HomePage() {
  const { level } = useProfile();
  const today = studyDay();
  const data = useLive(async () => {
    const [snapshot, attemptsToday, allAttempts, activeDays] = await Promise.all([
      loadStudySnapshot(level),
      repo.getAttemptsOn(today),
      repo.getAttempts(),
      repo.getActiveDays(),
    ]);
    return { snapshot, attemptsToday, allAttempts, streak: computeStreak(activeDays, today) };
  }, [level, today]);

  if (!data) return <div className="loading" aria-busy="true" />;

  const { queue } = data.snapshot;
  const due = queue.learning.length + queue.review.length;
  const fresh = queue.fresh.length;
  const doneToday = (kind: Attempt['kind'], refId?: string) => data.attemptsToday.some((a) => a.kind === kind && (!refId || a.refId === refId));

  const reading = pickDaily(readings, today, level);
  const passedLessons = new Set(data.allAttempts.filter((a) => a.kind === 'grammar' && a.score >= 70).map((a) => a.refId));
  const levelLessons = lessons.filter((l) => l.level === level);
  const lesson = levelLessons.find((l) => !passedLessons.has(l.id)) ?? levelLessons[0];

  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour < 18 ? 'Buongiorno' : 'Buonasera';
  const streakText =
    data.streak === 0 ? 'Première séance du jour.' : data.streak === 1 ? 'Un jour d’affilée.' : `${data.streak} jours d’affilée.`;

  return (
    <div className="home">
      <header className="home__head">
        <h1 lang="it">{greeting}</h1>
        <p className="muted">{streakText}</p>
      </header>

      <LevelLine current={level} />

      <section className="section" aria-labelledby="today">
        <h2 id="today">Aujourd’hui</h2>
        <ul className="rows">
          <TaskRow
            to="/cartes/session"
            line="cartes"
            icon="cards"
            title="Cartes"
            meta={due + fresh === 0 ? 'Tout est à jour' : `${due} à revoir, ${fresh} nouvelles`}
            done={due + fresh === 0}
          />
          {reading && (
            <TaskRow
              to={`/lecture/${reading.id}`}
              line="lecture"
              icon="read"
              title="Lecture du jour"
              meta={<span lang="it">{reading.title}</span>}
              done={doneToday('reading', reading.id)}
            />
          )}
          {lesson ? (
            <TaskRow
              to={`/grammaire/${lesson.id}`}
              line="grammaire"
              icon="book"
              title="Grammaire"
              meta={lesson.title}
              done={doneToday('grammar', lesson.id)}
            />
          ) : (
            <TaskRow to="/grammaire" line="grammaire" icon="book" title="Grammaire" meta={`Pas encore de leçon ${level}, revois les précédentes`} />
          )}
          <TaskRow
            to="/traduction"
            line="traduction"
            icon="translate"
            title="Traduction"
            meta="8 phrases du français vers l’italien"
            done={doneToday('translation')}
          />
          <TaskRow to="/dictee" line="dictee" icon="pencil" title="Dictée" meta="5 phrases à écouter et écrire" done={doneToday('dictation')} />
          <TaskRow to="/oral" line="oral" icon="mic" title="Prononciation" meta="Répète après le modèle" done={doneToday('speaking')} />
        </ul>
      </section>

      <p className="muted small home__level">
        Niveau {level}, {LEVEL_NAMES[level].toLowerCase()}. Tu peux le changer dans ton profil.
      </p>
    </div>
  );
}

function TaskRow({ to, line, icon, title, meta, done }: { to: string; line: Line; icon: IconName; title: string; meta: ReactNode; done?: boolean }) {
  return (
    <li>
      <a className={`row${done ? ' is-done' : ''}`} href={`#${to}`}>
        <span className={`line-badge line-${line}`} aria-hidden>
          <Icon name={icon} size={20} />
        </span>
        <span className="row__body">
          <span className="row__title">{title}</span>
          <span className="row__meta">{meta}</span>
        </span>
        <span className="row__end">{done ? <Icon name="check" label="Fait aujourd’hui" /> : <Icon name="chevron" size={18} />}</span>
      </a>
    </li>
  );
}
