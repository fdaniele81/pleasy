const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_LENGTH} characters long` };
  }

  if (password.length > MAX_LENGTH) {
    return { valid: false, error: `Password must be at most ${MAX_LENGTH} characters long` };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}
