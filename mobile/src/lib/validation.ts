// Client-side validation mirroring backend rules exactly.
// Each validator returns an error string, or null when valid.

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(value: string): string | null {
  if (!value) return 'Username is required';
  if (/[A-Z]/.test(value)) return 'Username must be lowercase';
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (value.length > 20) return 'Username must be at most 20 characters';
  if (!USERNAME_RE.test(value)) {
    return 'Username may only contain lowercase letters, digits and underscores';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(value)) return 'Password must contain a letter';
  if (!/[0-9]/.test(value)) return 'Password must contain a digit';
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value) return 'Email is required';
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address';
  return null;
}

export function validateDisplayName(value: string): string | null {
  if (!value || !value.trim()) return 'Display name is required';
  if (value.length > 60) return 'Display name must be at most 60 characters';
  return null;
}

export function validateBio(value: string): string | null {
  if (value.length > 280) return 'Bio must be at most 280 characters';
  return null;
}

export function validatePostContent(value: string): string | null {
  if (value.length > 5000) return 'Post must be at most 5000 characters';
  return null;
}

export function validateComment(value: string): string | null {
  if (!value || !value.trim()) return 'Comment cannot be empty';
  if (value.length > 2000) return 'Comment must be at most 2000 characters';
  return null;
}
