// IndexedDB: `localCache` (snapshot) + `syncQueue` (pending mutations). Medical data lives ONLY here, never in the SW cache.
export type QueueItem = { id: string; entity: 'patient' | 'visit' | 'settings'; action: 'upsert' | 'delete'; payload: any; timestamp: number; retryCount: number; lastError: string };
const open = () => new Promise<IDBDatabase>((res, rej) => {
  const r = indexedDB.open('ovacare', 1);
  r.onupgradeneeded = () => { r.result.createObjectStore('localCache'); r.result.createObjectStore('syncQueue', { keyPath: 'id' }); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
async function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await open();
  return new Promise<T>((res, rej) => {
    const t = db.transaction(store, mode); const rq: any = fn(t.objectStore(store));
    t.oncomplete = () => { db.close(); res(rq?.result); };
    t.onerror = () => { db.close(); rej(t.error); }; t.onabort = () => { db.close(); rej(t.error); };
  });
}
export const cacheGet = (k: string) => run<any>('localCache', 'readonly', (s) => s.get(k));
export const cacheSet = (k: string, v: any) => run('localCache', 'readwrite', (s) => s.put(v, k));
export const queueAll = () => run<QueueItem[]>('syncQueue', 'readonly', (s) => s.getAll());
export const queuePut = (q: QueueItem) => run('syncQueue', 'readwrite', (s) => s.put(q));
// only touch an item if the user hasn't edited it again while the batch was in flight
export const queueDelIfUnchanged = (id: string, ts: number) => run('syncQueue', 'readwrite', (s) => { const g = s.get(id); g.onsuccess = () => { if (g.result?.timestamp === ts) s.delete(id); }; });
export const queueMarkIfUnchanged = (id: string, ts: number, patch: Partial<QueueItem>) => run('syncQueue', 'readwrite', (s) => { const g = s.get(id); g.onsuccess = () => { if (g.result?.timestamp === ts) s.put({ ...g.result, ...patch }); }; });
export const wipeAll = async () => { await run('localCache', 'readwrite', (s) => s.clear()); await run('syncQueue', 'readwrite', (s) => s.clear()); };
