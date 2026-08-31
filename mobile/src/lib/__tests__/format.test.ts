import { relativeTime, compactCount } from '@/lib/format';

describe('relativeTime', () => {
  const now = new Date('2026-08-31T12:00:00Z');
  it('shows "just now" under 45s', () => {
    expect(relativeTime('2026-08-31T11:59:30Z', now)).toBe('just now');
  });
  it('shows minutes then hours then days', () => {
    expect(relativeTime('2026-08-31T11:30:00Z', now)).toBe('30m');
    expect(relativeTime('2026-08-31T09:00:00Z', now)).toBe('3h');
    expect(relativeTime('2026-08-28T12:00:00Z', now)).toBe('3d');
  });
});

describe('compactCount', () => {
  it('formats thousands', () => {
    expect(compactCount(999)).toBe('999');
    expect(compactCount(1500)).toBe('1.5k');
    expect(compactCount(12000)).toBe('12k');
  });
});
