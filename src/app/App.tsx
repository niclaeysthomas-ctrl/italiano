import type { ReactNode } from 'react';
import { repo } from '../data/repo.ts';
import { useLive } from '../lib/live.ts';
import { matchPath, usePath } from '../lib/router.tsx';
import type { Params } from '../lib/router.tsx';
import { CardsPage } from '../features/cards/CardsPage.tsx';
import { LexiconPage } from '../features/cards/LexiconPage.tsx';
import { EverydayPage } from '../features/everyday/EverydayPage.tsx';
import { EverydayTopicPage } from '../features/everyday/EverydayTopicPage.tsx';
import { ReviewPage } from '../features/cards/ReviewPage.tsx';
import { GrammarListPage } from '../features/grammar/GrammarListPage.tsx';
import { LessonPage } from '../features/grammar/LessonPage.tsx';
import { HomePage } from '../features/home/HomePage.tsx';
import { PlacementPage } from '../features/placement/PlacementPage.tsx';
import { DictationPage } from '../features/practice/DictationPage.tsx';
import { PracticePage } from '../features/practice/PracticePage.tsx';
import { SpeakingPage } from '../features/practice/SpeakingPage.tsx';
import { TranslationPage } from '../features/practice/TranslationPage.tsx';
import { ProfilePage } from '../features/profile/ProfilePage.tsx';
import { ReadingPage } from '../features/reading/ReadingPage.tsx';
import { WelcomePage } from '../features/welcome/WelcomePage.tsx';
import { ProfileContext, SettingsContext } from './context.ts';
import { TabBar } from './TabBar.tsx';

interface Route {
  pattern: string;
  render: (params: Params) => ReactNode;
  /** Masque la barre d'onglets (écrans de concentration). */
  focus?: boolean;
}

const ROUTES: Route[] = [
  { pattern: '/', render: () => <HomePage /> },
  { pattern: '/cartes', render: () => <CardsPage /> },
  { pattern: '/cartes/session', render: () => <ReviewPage />, focus: true },
  { pattern: '/lexique', render: () => <LexiconPage /> },
  { pattern: '/lexique/:deck', render: ({ deck }) => <LexiconPage key={deck} deckId={deck} /> },
  { pattern: '/quotidien', render: () => <EverydayPage /> },
  { pattern: '/quotidien/:id', render: ({ id }) => <EverydayTopicPage key={id} id={id} /> },
  { pattern: '/grammaire', render: () => <GrammarListPage /> },
  { pattern: '/grammaire/:id', render: ({ id }) => <LessonPage id={id} /> },
  { pattern: '/pratique', render: () => <PracticePage /> },
  { pattern: '/lecture', render: () => <ReadingPage /> },
  { pattern: '/lecture/:id', render: ({ id }) => <ReadingPage id={id} /> },
  { pattern: '/dictee', render: () => <DictationPage /> },
  { pattern: '/oral', render: () => <SpeakingPage /> },
  { pattern: '/traduction', render: () => <TranslationPage /> },
  { pattern: '/profil', render: () => <ProfilePage /> },
  { pattern: '/test', render: () => <PlacementPage />, focus: true },
];

function resolve(path: string): { route: Route; params: Params } | null {
  for (const route of ROUTES) {
    const params = matchPath(route.pattern, path);
    if (params) return { route, params };
  }
  return null;
}

export function App() {
  const path = usePath();
  const profile = useLive(() => repo.getProfile());
  const settings = useLive(() => repo.getSettings());

  if (profile === undefined || settings === undefined) {
    return <div className="loading" aria-busy="true" />;
  }

  const match = resolve(path);
  let content: ReactNode;
  let focus = true;

  if (!profile) {
    // Avant le premier choix de niveau, seuls l'accueil et le test de niveau sont accessibles.
    content = match?.route.pattern === '/test' ? <PlacementPage /> : <WelcomePage />;
  } else if (!match) {
    content = (
      <div className="empty">
        <p className="empty__title">Cette page n’existe pas.</p>
        <a className="btn btn--primary btn--block" href="#/">
          Retour à l’accueil
        </a>
      </div>
    );
    focus = false;
  } else {
    content = match.route.render(match.params);
    focus = Boolean(match.route.focus);
  }

  return (
    <SettingsContext.Provider value={settings}>
      <ProfileContext.Provider value={profile}>
        <div className={`app${focus ? ' app--focus' : ''}`}>
          <main>{content}</main>
        </div>
        {!focus && <TabBar path={path} />}
      </ProfileContext.Provider>
    </SettingsContext.Provider>
  );
}
