// ─── Persistent Storage via AsyncStorage ──────────────────────────────────────
// Data shape: { "2026-06-10": ["452", "452", "356"], "2026-06-09": [...], ... }

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@counter_numbers_v1';

/** Load the entire data object from storage. */
async function loadAll() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Persist the entire data object. */
async function saveAll(data) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage save error:', e);
  }
}

/** Return the raw array of entries for a given dateKey. */
export async function getEntries(dateKey) {
  const data = await loadAll();
  return data[dateKey] || [];
}

/** Append a number string to a date's entries. Returns the updated array. */
export async function addEntry(dateKey, num) {
  const data = await loadAll();
  if (!data[dateKey]) data[dateKey] = [];
  data[dateKey].push(num);
  await saveAll(data);
  return data[dateKey];
}

/**
 * Remove one occurrence of `num` from a date (removes the last occurrence).
 * Returns the updated array.
 */
export async function removeOneEntry(dateKey, num) {
  const data = await loadAll();
  if (!data[dateKey]) return [];
  // Remove last occurrence
  const arr = [...data[dateKey]];
  const idx = arr.lastIndexOf(num);
  if (idx !== -1) arr.splice(idx, 1);
  data[dateKey] = arr;
  await saveAll(data);
  return arr;
}

/**
 * Group a raw entries array into [{number, count}] in first-seen order.
 * e.g. ["452","452","356","123"] → [{number:"452",count:2},{number:"356",count:1},...]
 */
export function groupCounts(entries) {
  const seen = Object.create(null);
  const order = [];
  for (const num of entries) {
    if (seen[num] === undefined) {
      seen[num] = 0;
      order.push(num);
    }
    seen[num]++;
  }
  return order.map(num => ({ number: num, count: seen[num] }));
}
