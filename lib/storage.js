import localforage from 'localforage';
localforage.config({ name: 'codeelysium' });

export async function cacheContent(key, obj) {
  await localforage.setItem(`content:${key}`, obj);
}
export async function getCachedContent(key) {
  return await localforage.getItem(`content:${key}`);
}

export async function queueEvent(evt) {
  const q = (await localforage.getItem('analyticsQueue')) || [];
  q.push({ ...evt, ts: new Date().toISOString() });
  await localforage.setItem('analyticsQueue', q);
}
export async function getQueue() {
  return (await localforage.getItem('analyticsQueue')) || [];
}
export async function clearQueue() {
  await localforage.removeItem('analyticsQueue');
}

// sync queued analytics to server route /api/analytics/sync (implement server)
export async function syncQueue() {
  const q = await getQueue();
  if (!q.length) return { sent: 0 };
  try {
    const res = await fetch('/api/analytics/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: q }),
    });
    if (res.ok) {
      await clearQueue();
      return { sent: q.length };
    }
    return { sent: 0 };
  } catch (err) {
    return { sent: 0, error: err.message };
  }
}
