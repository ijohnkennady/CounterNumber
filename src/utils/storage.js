// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'entries_v2_';

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function loadEntries(dateKey) {
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${dateKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveEntries(dateKey, entries) {
  await AsyncStorage.setItem(`${PREFIX}${dateKey}`, JSON.stringify(entries));
}

export async function addEntry(dateKey, number, count) {
  const entries = await loadEntries(dateKey);
  const id      = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const updated = [...entries, { id, number, count }];
  await saveEntries(dateKey, updated);
  return updated;
}

export async function removeEntry(dateKey, id) {
  const entries = await loadEntries(dateKey);
  const updated = entries.filter(e => e.id !== id);
  await saveEntries(dateKey, updated);
  return updated;
}

// ── Auto-delete entries older than 30 days ────────────────────────────────────

export async function purgeOldEntries() {
  try {
    const keys    = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(k => k.startsWith(PREFIX));

    const cutoff  = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    cutoff.setHours(0, 0, 0, 0);

    const toDelete = appKeys.filter(key => {
      const dateStr = key.replace(PREFIX, ''); // → YYYY-MM-DD
      const date    = new Date(dateStr);
      return date < cutoff;
    });

    if (toDelete.length > 0) {
      await AsyncStorage.multiRemove(toDelete);
      console.log(`🗑️ Auto-deleted ${toDelete.length} old entries:`, toDelete);
    }
  } catch (e) {
    console.warn('purgeOldEntries error:', e);
  }
}