/**
 * Brouillons de rapports sur le téléphone (IndexedDB).
 * Les photos sont volumineuses : localStorage (≈5 Mo) serait vite saturé.
 * Un rapport reste sur l'appareil tant qu'il n'est pas envoyé.
 */
import type { InterventionDraft } from "./types";

const DB_NAME = "vemat-rapports";
const STORE = "drafts";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

export async function saveDraft(d: InterventionDraft): Promise<void> {
  await run("readwrite", (s) => s.put({ ...d, updatedAt: Date.now() }));
}

export async function getDraft(id: string): Promise<InterventionDraft | undefined> {
  return run("readonly", (s) => s.get(id) as IDBRequest<InterventionDraft | undefined>);
}

export async function listDrafts(): Promise<InterventionDraft[]> {
  const all = await run("readonly", (s) => s.getAll() as IDBRequest<InterventionDraft[]>);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDraft(id: string): Promise<void> {
  await run("readwrite", (s) => s.delete(id));
}

/** Petits réglages réutilisés d'un rapport à l'autre (véhicule). */
export function loadPref(key: string): string {
  try { return localStorage.getItem(`vemat-rapport-${key}`) ?? ""; } catch { return ""; }
}
export function savePref(key: string, value: string): void {
  try { localStorage.setItem(`vemat-rapport-${key}`, value); } catch { /* stockage indisponible : sans conséquence */ }
}
