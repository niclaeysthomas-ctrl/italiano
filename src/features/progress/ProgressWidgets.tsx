import { LEVEL_NAMES } from '../../core/cefr.ts';
import type { Level } from '../../core/cefr.ts';
import { addDays, parseDay } from '../../core/dates.ts';
import { THRESHOLDS, calendarGrid } from '../../core/progress/progress.ts';
import type { LevelReadiness } from '../../core/progress/progress.ts';
import { repo } from '../../data/repo.ts';
import type { Profile } from '../../data/repo.ts';
import { CALENDAR_WEEKS } from './progressData.ts';

/** Barre de l'objectif du jour. */
export function GoalBar({ points, goal }: { points: number; goal: number }) {
  const ratio = Math.min(1, points / goal);
  const done = points >= goal;
  return (
    <div className="goal">
      <div className="goal__label">
        <span>{done ? 'Objectif du jour atteint' : 'Objectif du jour'}</span>
        <span className="goal__count">
          {points} / {goal} points
        </span>
      </div>
      <div className={`goal__track${done ? ' is-done' : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(points, goal)} aria-label="Objectif du jour">
        <div className="goal__fill" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

/** Proposition de passer au niveau suivant, quand les critères sont remplis. */
export function LevelUpBanner({ profile, readiness }: { profile: Profile; readiness: LevelReadiness }) {
  if (!readiness.ready || !readiness.next) return null;
  const next = readiness.next;
  return (
    <section className="levelup" aria-labelledby="levelup-title">
      <h2 id="levelup-title">
        Prêt pour le niveau {next} ?
      </h2>
      <p>
        Tu as acquis {Math.round(readiness.vocab * 100)} % des mots du niveau {profile.level}, réussi {Math.round(readiness.grammar * 100)} % de ses leçons, et
        tes exercices récents sont à {Math.round(readiness.exercises ?? 0)} % en moyenne.
      </p>
      <div className="toolbar">
        <button type="button" className="btn btn--primary btn--small" onClick={() => repo.saveProfile({ ...profile, level: next })}>
          Passer en {next}
        </button>
        <a className="btn btn--small" href="#/profil">
          Voir le détail
        </a>
      </div>
    </section>
  );
}

const weekday = (day: string) => (parseDay(day).getDay() + 6) % 7;
const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Calendrier d'activité des 12 dernières semaines. */
export function ActivityCalendar({ activity, today, goal }: { activity: Map<string, number>; today: string; goal: number }) {
  const grid = calendarGrid(today, CALENDAR_WEEKS, addDays, weekday);
  const tone = (points: number) => (points === 0 ? 0 : points < goal / 2 ? 1 : points < goal ? 2 : 3);
  const activeDays = [...activity.entries()].filter(([, p]) => p > 0).length;
  return (
    <figure className="calendar">
      <div className="calendar__grid" role="img" aria-label={`Activité des ${CALENDAR_WEEKS} dernières semaines : ${activeDays} jours de pratique.`}>
        <div className="calendar__days" aria-hidden>
          {DAY_LETTERS.map((d, i) => (
            <span key={i}>{i % 2 === 0 ? d : ''}</span>
          ))}
        </div>
        {grid.map((column, c) => (
          <div key={c} className="calendar__col">
            {column.map((day, r) =>
              day ? (
                <span key={r} className={`calendar__cell t${tone(activity.get(day) ?? 0)}${day === today ? ' is-today' : ''}`} title={`${parseDay(day).toLocaleDateString('fr-FR')} : ${activity.get(day) ?? 0} points`} />
              ) : (
                <span key={r} className="calendar__cell is-empty" />
              ),
            )}
          </div>
        ))}
      </div>
      <figcaption className="calendar__legend">
        <span>Moins</span>
        {[0, 1, 2, 3].map((t) => (
          <span key={t} className={`calendar__cell t${t}`} />
        ))}
        <span>Objectif atteint</span>
      </figcaption>
    </figure>
  );
}

/** Où en est la personne dans son niveau, critère par critère. */
export function LevelCriteria({ level, readiness }: { level: Level; readiness: LevelReadiness }) {
  const rows = [
    { label: 'Mots acquis', value: readiness.vocab, target: THRESHOLDS.vocab, text: `${Math.round(readiness.vocab * 100)} %` },
    { label: 'Leçons réussies', value: readiness.grammar, target: THRESHOLDS.grammar, text: `${Math.round(readiness.grammar * 100)} %` },
    {
      label: 'Exercices, 30 derniers jours',
      value: readiness.exercises === null ? 0 : readiness.exercises / 100,
      target: THRESHOLDS.exercises / 100,
      text: readiness.exercises === null ? `moins de ${THRESHOLDS.minExercises} exercices` : `${Math.round(readiness.exercises)} % de moyenne`,
    },
  ];
  return (
    <div className="criteria">
      <p className="muted small">
        Pour passer au niveau suivant après {level} ({LEVEL_NAMES[level].toLowerCase()}), il faut atteindre le repère sur les trois lignes.
      </p>
      {rows.map((row) => (
        <div key={row.label} className="criteria__row">
          <div className="criteria__label">
            <span>{row.label}</span>
            <span className={row.value >= row.target ? 'is-ok' : undefined}>{row.text}</span>
          </div>
          <div className="criteria__track">
            <div className="criteria__fill" style={{ width: `${Math.min(1, row.value) * 100}%` }} />
            <div className="criteria__mark" style={{ left: `${row.target * 100}%` }} title={`Repère : ${Math.round(row.target * 100)} %`} />
          </div>
        </div>
      ))}
    </div>
  );
}
