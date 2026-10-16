import { repo } from '../../data/repo.ts';
import { navigate } from '../../lib/router.tsx';
import { LevelLine } from '../../ui/LevelLine.tsx';

export function WelcomePage() {
  const startAtA1 = async () => {
    await repo.saveProfile({ level: 'A1', createdAt: Date.now(), placement: null });
    navigate('/', { replace: true });
  };

  return (
    <div className="welcome">
      <p className="welcome__brand" lang="it">
        Italiano
      </p>
      <h1 className="welcome__title">Apprends l’italien, de&nbsp;A1 à&nbsp;C1.</h1>
      <LevelLine />
      <p className="welcome__lead">
        Chaque jour : tes cartes à réviser, une lecture, un point de grammaire, de l’écoute et de l’oral. Ta progression reste sur cet appareil.
      </p>
      <div className="stack">
        <a className="btn btn--primary btn--block" href="#/test">
          Passer le test de niveau
        </a>
        <button type="button" className="btn btn--block" onClick={startAtA1}>
          Je débute : commencer en A1
        </button>
      </div>
      <p className="muted small">Le test dure environ 5 minutes. Certaines questions sont à écouter : monte le son.</p>
    </div>
  );
}
