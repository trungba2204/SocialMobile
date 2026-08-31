import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'orbit.searches';
const MAX = 8;

export async function list(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is string => typeof t === 'string');
  } catch {
    return [];
  }
}

export async function add(term: string): Promise<void> {
  const trimmed = term.trim();
  if (!trimmed) return;
  const current = await list();
  const deduped = current.filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...deduped].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function clear(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
