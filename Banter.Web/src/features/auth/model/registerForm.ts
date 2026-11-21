export interface RegisterFormState {
  displayName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export const initialRegisterForm: RegisterFormState = {
  displayName: '',
  email: '',
  password: '',
  passwordConfirm: '',
};

export function validateRegisterForm(form: RegisterFormState): string | null {
  if (form.displayName.trim().length < 2) {
    return 'Add a display name with at least two characters.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return 'Enter a valid email address.';
  }
  if (form.password.length < 8) return 'Use at least 8 characters for the password.';
  if (!/[A-Z]/.test(form.password)) return 'Include at least one uppercase letter.';
  if (!/[a-z]/.test(form.password)) return 'Include at least one lowercase letter.';
  if (!/[0-9]/.test(form.password)) return 'Include at least one number.';
  if (!/[^A-Za-z0-9]/.test(form.password)) return 'Include at least one symbol.';
  if (form.password !== form.passwordConfirm) return 'Passwords do not match.';
  return null;
}

export function registerPayload(form: RegisterFormState) {
  return {
    email: form.email.trim(),
    displayName: form.displayName.trim(),
    password: form.password,
    passwordConfirm: form.passwordConfirm,
  };
}
