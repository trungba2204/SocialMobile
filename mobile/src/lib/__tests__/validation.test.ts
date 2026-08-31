import {
  validateEmail,
  validatePassword,
  validateUsername,
} from '@/lib/validation';

describe('validateUsername', () => {
  it('username rule matches backend', () => {
    expect(validateUsername('alice_1')).toBeNull();
    expect(validateUsername('Alice')).toMatch(/lowercase/);
    expect(validateUsername('ab')).toBeTruthy();
  });

  it('rejects too long and bad chars', () => {
    expect(validateUsername('a'.repeat(21))).toBeTruthy();
    expect(validateUsername('bad-name')).toBeTruthy();
  });
});

describe('validatePassword', () => {
  it('password needs letter + digit + length', () => {
    expect(validatePassword('abc12345')).toBeNull();
    expect(validatePassword('short1')).toBeTruthy();
    expect(validatePassword('alllettersz')).toBeTruthy();
    expect(validatePassword('12345678')).toBeTruthy();
  });
});

describe('validateEmail', () => {
  it('accepts valid, rejects invalid', () => {
    expect(validateEmail('a@b.co')).toBeNull();
    expect(validateEmail('nope')).toBeTruthy();
  });
});
