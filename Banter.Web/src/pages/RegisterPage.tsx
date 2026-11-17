import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthFrame } from '../components/AuthFrame';
import { useAuth } from '../auth/AuthProvider';
import { api, errorMessage } from '../lib/api';

interface FormState {
  displayName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

const initialForm: FormState = {
  displayName: '',
  email: '',
  password: '',
  passwordConfirm: '',
};

export function RegisterPage() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const update = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldError(null);
  };

  const validate = (): string | null => {
    if (form.displayName.trim().length < 2) return 'Add a display name with at least two characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
    if (form.password.length < 8) return 'Use at least 8 characters for the password.';
    if (!/[A-Z]/.test(form.password)) return 'Include at least one uppercase letter.';
    if (!/[a-z]/.test(form.password)) return 'Include at least one lowercase letter.';
    if (!/[0-9]/.test(form.password)) return 'Include at least one number.';
    if (form.password !== form.passwordConfirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setPending(true);
    setError(null);
    try {
      await api.register({
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        password: form.password,
        passwordConfirm: form.passwordConfirm,
      });
      await refreshSession();
      navigate('/inbox', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthFrame
      label="new account"
      step="02 / 02"
      footer={
        <p className="auth__quiet-note mono">
          Registration signs you in immediately. Email confirmation is disabled in this demo API.
        </p>
      }
    >
      <div className="auth-form">
        <Link to="/login" className="back-link">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to demo access
        </Link>

        <div className="auth-form__heading">
          <h1>Make a seat at the desk.</h1>
          <p>
            This creates a real ASP.NET Identity account. You will land in the inbox with a fresh
            session, ready to search for someone.
          </p>
        </div>

        <form className="form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="field">
            <span className="field__label mono">display name</span>
            <input
              type="text"
              name="displayName"
              autoComplete="name"
              required
              maxLength={256}
              value={form.displayName}
              onChange={update('displayName')}
              placeholder="How people see you"
            />
          </label>

          <label className="field">
            <span className="field__label mono">email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
            />
          </label>

          <div className="field">
            <label className="field__label mono" htmlFor="register-password">
              password
            </label>
            <span className="field__password">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={update('password')}
                placeholder="8+ characters, one uppercase, one number"
              />
              <button
                type="button"
                className="field__reveal"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </span>
          </div>

          <label className="field">
            <span className="field__label mono">confirm password</span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="passwordConfirm"
              autoComplete="new-password"
              required
              value={form.passwordConfirm}
              onChange={update('passwordConfirm')}
              placeholder="Repeat the password"
            />
          </label>

          {(fieldError || error) && (
            <p className="form-error" role="alert">
              {fieldError ?? error}
            </p>
          )}

          <button type="submit" className="button button--ink button--wide" disabled={pending}>
            {pending && <Loader2 className="spin" size={16} aria-hidden="true" />}
            {pending ? 'Creating your seat…' : 'Create account'}
          </button>
        </form>

        <p className="auth-links auth-links--plain">
          Already have a session?{' '}
          <Link to="/login" className="inline-link">
            Sign in
          </Link>
        </p>
      </div>
    </AuthFrame>
  );
}
