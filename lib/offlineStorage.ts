// lib/offlineStorage.ts
// A small wrapper that prefers idb-keyval (IndexedDB) when available,
// but falls back to localStorage (browser only) if idb-keyval isn't installed
// or unavailable. This avoids build-time module-not-found errors.

type AnyObj = Record<string, any>;

/** Helper to try dynamic import of idb-keyval */
async function tryIdb() {
  try {
    const mod = await import("idb-keyval");
    // mod exports get, set, del, clear, etc.
    return mod as {
      get: (k: string) => Promise<any>;
      set: (k: string, v: any) => Promise<void>;
      del: (k: string) => Promise<void>;
    };
  } catch (e) {
    return null;
  }
}

/** Browser localStorage helpers (synchronous) */
function lsGet(key: string): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function lsSet(key: string, value: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function lsDel(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Public API */

/** Index (list of lessons) */
export async function getIndex(): Promise<AnyObj | null> {
  const idb = await tryIdb();
  if (idb?.get) {
    try {
      return (await idb.get("offline-index")) ?? null;
    } catch {
      return lsGet("offline-index");
    }
  }
  return lsGet("offline-index");
}

export async function setIndex(indexObj: AnyObj): Promise<void> {
  const idb = await tryIdb();
  if (idb?.set) {
    try {
      await idb.set("offline-index", indexObj);
      return;
    } catch {
      /* fallthrough to localStorage */
    }
  }
  lsSet("offline-index", indexObj);
}

/** Lessons */
export async function getLesson(id: string): Promise<AnyObj | null> {
  const key = `lesson:${id}`;
  const idb = await tryIdb();
  if (idb?.get) {
    try {
      return (await idb.get(key)) ?? null;
    } catch {
      return lsGet(key);
    }
  }
  return lsGet(key);
}

export async function setLesson(id: string, lessonObj: AnyObj): Promise<void> {
  const key = `lesson:${id}`;
  const idb = await tryIdb();
  if (idb?.set) {
    try {
      await idb.set(key, lessonObj);
      return;
    } catch {
      /* fallthrough */
    }
  }
  lsSet(key, lessonObj);
}

export async function removeLesson(id: string): Promise<void> {
  const key = `lesson:${id}`;
  const idb = await tryIdb();
  if (idb?.del) {
    try {
      await idb.del(key);
      return;
    } catch {
      /* fallthrough */
    }
  }
  lsDel(key);
}
