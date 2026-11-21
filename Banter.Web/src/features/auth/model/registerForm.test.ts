import { describe, expect, it } from 'vitest';
import { initialRegisterForm, validateRegisterForm } from './registerForm';

describe('registration validation', () => {
  const valid = {
    displayName: 'Islam Rafat',
    email: 'islam@example.com',
    password: 'Password1!',
    passwordConfirm: 'Password1!',
  };

  it('accepts a complete, strong form', () => {
    expect(validateRegisterForm(valid)).toBeNull();
  });

  it('rejects missing names and malformed emails', () => {
    expect(validateRegisterForm({ ...valid, displayName: 'I' })).toBe(
      'Add a display name with at least two characters.',
    );
    expect(validateRegisterForm({ ...valid, email: 'not-an-email' })).toBe(
      'Enter a valid email address.',
    );
    expect(validateRegisterForm({ ...initialRegisterForm, displayName: 'Islam' })).toBe(
      'Enter a valid email address.',
    );
  });

  it('enforces the password policy and matching confirmation', () => {
    expect(validateRegisterForm({ ...valid, password: 'short', passwordConfirm: 'short' })).toBe(
      'Use at least 8 characters for the password.',
    );
    expect(
      validateRegisterForm({ ...valid, password: 'password1', passwordConfirm: 'password1' }),
    ).toBe('Include at least one uppercase letter.');
    expect(
      validateRegisterForm({ ...valid, password: 'PASSWORD1', passwordConfirm: 'PASSWORD1' }),
    ).toBe('Include at least one lowercase letter.');
    expect(
      validateRegisterForm({ ...valid, password: 'Password', passwordConfirm: 'Password' }),
    ).toBe('Include at least one number.');
    expect(
      validateRegisterForm({ ...valid, password: 'Password1', passwordConfirm: 'Password1' }),
    ).toBe('Include at least one symbol.');
    expect(validateRegisterForm({ ...valid, passwordConfirm: 'Different1!' })).toBe(
      'Passwords do not match.',
    );
  });
});
