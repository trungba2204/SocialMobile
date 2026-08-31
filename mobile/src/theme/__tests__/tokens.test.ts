import { lightColors, darkColors, space } from '@/theme/tokens';

it('light and dark expose the same keys', () => {
  expect(Object.keys(lightColors).sort()).toEqual(Object.keys(darkColors).sort());
});

it('spacing scale is 4-based', () => {
  expect(space.md).toBe(12);
  expect(space.xl).toBe(24);
});
