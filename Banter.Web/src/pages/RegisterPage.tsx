import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthFrame } from '../components/AuthFrame';
import { PrivateWindowNote } from '../components/PrivateWindowNote';
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
      marker="access board / 02"
      footer={
        <p className="board__quiet-note mono">
          You will be signed in as soon as your account is created. The demo roster needs no
          password and stays available from the sign-in board.
        </p>
      }
    >
      <div className="access access--account">
        <section className="board-section" aria-labelledby="register-heading">
          <div className="board-section__head board-section__head--form">
            <div>
              <p className="mono board-section__index">02 / new account</p>
              <h2 id="register-heading">Make a seat at the desk.</h2>
            </div>
            <p className="board-section__note">
              Your account gets a fresh inbox and a directory to search for a first conversation.
            </p>
          </div>

          <div className="account-form__lead">
            <Link to="/login" className="back-link">
              <ArrowLeft size={15} aria-hidden="true" />
              Back to the access board
            </Link>
            <p className="account-form__intro">
              Four fields, one seat. Your display name is how everyone in the room will see you.
            </p>
          </div>

          <form className="account-form" onSubmit={(event) => void handleSubmit(event)}>
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
                  {showPassword ? (
                    <EyeOff size={17} aria-hidden="true" />
                  ) : (
                    <Eye size={17} aria-hidden="true" />
                  )}
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
              <p className="form-error board-form-error" role="alert">
                {fieldError ?? error}
              </p>
            )}

            <div className="account-form__actions">
              <button type="submit" className="button button--ink" disabled={pending}>
                {pending && <Loader2 className="spin" size={16} aria-hidden="true" />}
                {pending ? 'Creating your seat…' : 'Create account'}
              </button>
              <p>
                Already have a session?{' '}
                <Link to="/login" className="inline-link">
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          <div className="account-form__note">
            <p className="mono">what the seat includes</p>
            <div className="account-form__facts">
              <span>live threads</span>
              <span>presence</span>
              <span>saved history</span>
              <span>direct + group wires</span>
            </div>
            <PrivateWindowNote compact />
          </div>
        </section>
      </div>
    </AuthFrame>
  );
}
