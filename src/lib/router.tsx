/**
 * Routeur minimal basé sur le fragment d'URL (#/chemin) : compatible avec un hébergement statique
 * comme GitHub Pages, sans configuration côté serveur.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

function readPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith('/') ? hash : '/';
}

export function navigate(to: string, options: { replace?: boolean } = {}) {
  if (options.replace) {
    window.history.replaceState(null, '', `#${to}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = to;
  }
}

export function usePath(): string {
  const [path, setPath] = useState(readPath);
  useEffect(() => {
    const onChange = () => {
      setPath(readPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

export type Params = Record<string, string>;

/** `matchPath('/grammaire/:id', '/grammaire/a1-articoli')` → `{ id: 'a1-articoli' }`. */
export function matchPath(pattern: string, path: string): Params | null {
  const expected = pattern.split('/').filter(Boolean);
  const actual = path.split('?')[0].split('/').filter(Boolean);
  if (expected.length !== actual.length) return null;
  const params: Params = {};
  for (let i = 0; i < expected.length; i++) {
    if (expected[i].startsWith(':')) params[expected[i].slice(1)] = decodeURIComponent(actual[i]);
    else if (expected[i] !== actual[i]) return null;
  }
  return params;
}

export function Link({ to, className, children, current }: { to: string; className?: string; children: ReactNode; current?: boolean }) {
  return (
    <a href={`#${to}`} className={className} aria-current={current ? 'page' : undefined}>
      {children}
    </a>
  );
}
