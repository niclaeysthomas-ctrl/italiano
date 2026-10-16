/**
 * Petite couche au-dessus d'IndexedDB : toute la progression reste dans le navigateur de l'appareil.
 *
 * Magasins :
 * - kv         : profil, réglages, jours d'activité (clé → valeur)
 * - cards      : état de répétition espacée de chaque carte (clé : id de carte)
 * - reviews    : journal de chaque réponse à une carte (index : day, cardId)
 * - attempts   : résultats d'exercices — grammaire, lecture, dictée, oral (index : day, kind)
 * - userNotes  : mots ajoutés par la personne (depuis une lecture ou à la main)
 *
 * Pour faire évoluer le schéma : incrémenter DB_VERSION et ajouter un bloc `if (oldVersion < N)`.
 */
const DB_NAME = 'italiano';
const DB_VERSION = 1;

export type StoreName = 'kv' | 'cards' | 'reviews' | 'attempts' | 'userNotes';
export const STORES: readonly StoreName[] = ['kv', 'cards', 'reviews', 'attempts', 'userNotes'];

function upgrade(db: IDBDatabase, oldVersion: number) {
  if (oldVersion < 1) {
    db.createObjectStore('kv');
    db.createObjectStore('cards', { keyPath: 'id' });
    const reviews = db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
    reviews.createIndex('day', 'day');
    reviews.createIndex('cardId', 'cardId');
    const attempts = db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
    attempts.createIndex('day', 'day');
    attempts.createIndex('kind', 'kind');
    db.createObjectStore('userNotes', { keyPath: 'id' });
  }
}

let opening: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Ce navigateur ne permet pas d’enregistrer ta progression (IndexedDB indisponible).'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => upgrade(request.result, event.oldVersion);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return opening;
}

/** Exécute une transaction et se résout quand elle est validée. */
export async function transaction(stores: StoreName | StoreName[], mode: IDBTransactionMode, work: (tx: IDBTransaction) => void): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    work(tx);
  });
}

async function request<T>(store: StoreName, mode: IDBTransactionMode, make: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  let result: T | undefined;
  await transaction(store, mode, (tx) => {
    const req = make(tx.objectStore(store));
    req.onsuccess = () => {
      result = req.result as T;
    };
  });
  return result as T;
}

export const idb = {
  get: <T>(store: StoreName, key: IDBValidKey) => request<T | undefined>(store, 'readonly', (s) => s.get(key)),
  getAll: <T>(store: StoreName) => request<T[]>(store, 'readonly', (s) => s.getAll()),
  getAllKeys: (store: StoreName) => request<IDBValidKey[]>(store, 'readonly', (s) => s.getAllKeys()),
  getByIndex: <T>(store: StoreName, index: string, query: IDBValidKey | IDBKeyRange) =>
    request<T[]>(store, 'readonly', (s) => s.index(index).getAll(query)),
  put: (store: StoreName, value: unknown, key?: IDBValidKey) => request<IDBValidKey>(store, 'readwrite', (s) => s.put(value, key)),
  delete: (store: StoreName, key: IDBValidKey) => request<undefined>(store, 'readwrite', (s) => s.delete(key)),
};
