import { Icon } from '../ui/Icon.tsx';
import type { IconName } from '../ui/Icon.tsx';

const TABS: { to: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
  { to: '/', label: 'Accueil', icon: 'home', match: (p) => p === '/' },
  { to: '/cartes', label: 'Cartes', icon: 'cards', match: (p) => p.startsWith('/cartes') || p.startsWith('/lexique') },
  { to: '/grammaire', label: 'Grammaire', icon: 'book', match: (p) => p.startsWith('/grammaire') || p.startsWith('/conjugaison') },
  { to: '/pratique', label: 'Pratique', icon: 'wave', match: (p) => ['/pratique', '/lecture', '/dictee', '/oral', '/traduction', '/examens'].some((s) => p.startsWith(s)) },
  { to: '/quotidien', label: 'Quotidien', icon: 'chat', match: (p) => p.startsWith('/quotidien') },
  { to: '/profil', label: 'Profil', icon: 'user', match: (p) => p.startsWith('/profil') },
];

export function TabBar({ path }: { path: string }) {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      <ul>
        {TABS.map((tab) => (
          <li key={tab.to}>
            <a href={`#${tab.to}`} aria-current={tab.match(path) ? 'page' : undefined}>
              <Icon name={tab.icon} />
              <span>{tab.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
