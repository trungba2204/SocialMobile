import AsyncStorage from '@react-native-async-storage/async-storage';
import { add, list, clear } from '@/lib/recentSearches';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('recentSearches', () => {
  it('adds terms most-recent-first', async () => {
    await add('alice');
    await add('ben');
    expect(await list()).toEqual(['ben', 'alice']);
  });

  it('moves a re-added term to the front', async () => {
    await add('alice');
    await add('ben');
    await add('alice');
    expect(await list()).toEqual(['alice', 'ben']);
  });

  it('caps history at 8 entries', async () => {
    for (const t of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10']) {
      await add(t);
    }
    const result = await list();
    expect(result).toHaveLength(8);
    expect(result[0]).toBe('a10');
    expect(result).not.toContain('a1');
    expect(result).not.toContain('a2');
  });

  it('clear() empties history', async () => {
    await add('alice');
    await clear();
    expect(await list()).toEqual([]);
  });

  it('ignores blank terms', async () => {
    await add('   ');
    expect(await list()).toEqual([]);
  });
});
