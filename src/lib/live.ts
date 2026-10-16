import { useEffect, useState } from 'react';
import type { DependencyList } from 'react';

const listeners = new Set<() => void>();

/** À appeler après chaque écriture en base : les écrans abonnés se rechargent. */
export function notifyDataChanged() {
  for (const listener of listeners) listener();
}

/**
 * Charge une donnée asynchrone et la recharge à chaque `notifyDataChanged()`.
 * Renvoie `undefined` tant que le premier chargement n'est pas terminé.
 */
export function useLive<T>(load: () => Promise<T>, deps: DependencyList = []): T | undefined {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    let active = true;
    const run = () => {
      load()
        .then((result) => {
          if (active) setValue(result);
        })
        .catch((error: unknown) => console.error(error));
    };
    run();
    listeners.add(run);
    return () => {
      active = false;
      listeners.delete(run);
    };
  }, deps);
  return value;
}
