'use client';
import { useEffect } from 'react';
import { syncQueue } from '../lib/storage';

export default function UseSync() {
  useEffect(() => {
    const onOnline = () => {
      syncQueue().then(r => console.log('sync result', r));
    };
    window.addEventListener('online', onOnline);
    if (navigator.onLine) onOnline();
    return () => window.removeEventListener('online', onOnline);
  }, []);
  return null;
}
