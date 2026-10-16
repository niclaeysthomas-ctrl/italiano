import type { ReactNode } from 'react';
import { Icon } from './Icon.tsx';

export type Line = 'cartes' | 'grammaire' | 'lecture' | 'dictee' | 'oral' | 'traduction' | 'neutre';

interface Props {
  title: string;
  back?: string;
  line?: Line;
  intro?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}

/** En-tête de page : retour éventuel, titre, et la couleur de « ligne » de l'activité. */
export function Page({ title, back, line = 'neutre', intro, aside, children }: Props) {
  return (
    <div className={`page line-${line}`}>
      <header className="page__head">
        {back && (
          <a className="page__back" href={`#${back}`}>
            <Icon name="back" size={20} />
            <span>Retour</span>
          </a>
        )}
        <div className="page__title">
          <h1>{title}</h1>
          {aside}
        </div>
        {intro && <div className="page__intro">{intro}</div>}
      </header>
      {children}
    </div>
  );
}

export function LineBadge({ line, icon }: { line: Line; icon: ReactNode }) {
  return (
    <span className={`line-badge line-${line}`} aria-hidden>
      {icon}
    </span>
  );
}
