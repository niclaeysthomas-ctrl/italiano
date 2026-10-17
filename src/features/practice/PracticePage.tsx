import type { ReactNode } from 'react';
import { LEVEL_NAMES } from '../../core/cefr.ts';
import { studyDay } from '../../core/dates.ts';
import { pickDaily } from '../../core/daily/pick.ts';
import { readings } from '../../content/index.ts';
import { useProfile } from '../../app/context.ts';
import { Icon } from '../../ui/Icon.tsx';
import { Page } from '../../ui/Page.tsx';

export function PracticePage() {
  const { level } = useProfile();
  const daily = pickDaily(readings, studyDay(), level);

  return (
    <Page title="Pratique" intro={<p>Lire, écouter, écrire et parler. Tout est calé sur ton niveau.</p>}>
      <a className="row feature-link exam-link" href="#/examens">
        <span className="line-badge line-neutre" aria-hidden>
          <Icon name="check" size={20} />
        </span>
        <span className="row__body">
          <span className="row__title">Examen blanc</span>
          <span className="row__meta">Simulation A1, A2 et B1 en cinq épreuves</span>
        </span>
        <span className="row__end">
          <Icon name="chevron" size={18} />
        </span>
      </a>
      <ul className="rows">
        {daily && (
          <PracticeRow to={`/lecture/${daily.id}`} line="lecture" icon={<Icon name="read" size={20} />} title="Lecture du jour" meta={daily.title} metaLang="it" />
        )}
        <PracticeRow to="/traduction" line="traduction" icon={<Icon name="translate" size={20} />} title="Traduction" meta="Du français vers l’italien, corrigé mot à mot" />
        <PracticeRow to="/conjugaison" line="grammaire" icon={<Icon name="pencil" size={20} />} title="Conjugaison" meta="Séries de 10 formes à conjuguer" />
        <PracticeRow to="/dictee" line="dictee" icon={<Icon name="pencil" size={20} />} title="Dictée" meta="Écoute une phrase, écris-la, compare" />
        <PracticeRow to="/oral" line="oral" icon={<Icon name="mic" size={20} />} title="Prononciation" meta="Répète après le modèle et vérifie" />
      </ul>

      <section className="section">
        <h2>Toutes les lectures</h2>
        <ul className="rows">
          {readings.map((reading) => (
            <li key={reading.id}>
              <a className="row" href={`#/lecture/${reading.id}`}>
                <span className="chip">{reading.level}</span>
                <span className="row__body">
                  <span className="row__title" lang="it">
                    {reading.title}
                  </span>
                  <span className="row__meta">{reading.level === level ? 'Ton niveau' : LEVEL_NAMES[reading.level]}</span>
                </span>
                <span className="row__end">
                  <Icon name="chevron" size={18} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}

function PracticeRow({ to, line, icon, title, meta, metaLang }: { to: string; line: string; icon: ReactNode; title: string; meta: string; metaLang?: string }) {
  return (
    <li>
      <a className="row" href={`#${to}`}>
        <span className={`line-badge line-${line}`} aria-hidden>
          {icon}
        </span>
        <span className="row__body">
          <span className="row__title">{title}</span>
          <span className="row__meta" lang={metaLang}>
            {meta}
          </span>
        </span>
        <span className="row__end">
          <Icon name="chevron" size={18} />
        </span>
      </a>
    </li>
  );
}
